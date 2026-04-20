"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Upload, X, ImageIcon, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { StorageService, ImageData } from "@/lib/storage"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

interface ImageUploadProps {
  onImagesChange?: (images: ImageData[]) => void
  maxImages?: number
  recordId?: string
  value?: ImageData[]
}

export function ImageUpload({ onImagesChange, maxImages = 6, recordId, value }: ImageUploadProps) {
  const { user } = useAuth()
  const [images, setImages] = useState<ImageData[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const isInternalUpdate = useRef(false)
  const lastNotifiedRef = useRef<string>('')

  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false
      return
    }
    
    if (value && value.length > 0) {
      setImages(prev => {
        const prevUrls = prev.map(img => img.url).join(',')
        const valueUrls = value.map(img => img.url).join(',')
        
        if (prevUrls !== valueUrls) {
          return value
        }
        return prev
      })
    }
  }, [value])

  useEffect(() => {
    const currentUrls = images
      .filter(img => img.status === 'completed')
      .map(img => img.url)
      .join(',')

    if (currentUrls !== lastNotifiedRef.current && currentUrls !== '') {
      lastNotifiedRef.current = currentUrls
      const completedImages = images
        .filter(img => img.status === 'completed')
        .map(img => ({ ...img, file: undefined as File | undefined }))
      onImagesChange?.(completedImages)
    }
  }, [images, onImagesChange])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      )

      addImages(files)
    },
    [images, maxImages]
  )

  const addImages = async (files: File[]) => {
    if (!user) {
      toast.error("Debes iniciar sesión para subir imágenes")
      return
    }

    const remainingSlots = maxImages - images.length
    const filesToAdd = files.slice(0, remainingSlots)

    const validFiles: File[] = []
    for (const file of filesToAdd) {
      const validation = StorageService.validateImageFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        toast.error(`${file.name}: ${validation.error}`)
      }
    }

    if (validFiles.length === 0) return

    const newImages: ImageData[] = validFiles.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      uploadProgress: 0,
      status: 'uploading' as const,
    }))

    isInternalUpdate.current = true
    const updatedImages = [...images, ...newImages]
    setImages(updatedImages)

    for (const imageData of newImages) {
      try {
        const pathIdentifier = `images/${user.uid}/${recordId || 'temp'}/${Date.now()}`

        try {
          setImages(prev =>
            prev.map(img =>
              img.id === imageData.id
                ? { ...img, status: 'uploading' as const }
                : img
            )
          )

          const downloadURL = await StorageService.uploadImage(
            imageData.file,
            pathIdentifier
          )

          isInternalUpdate.current = true
          setImages(prev =>
            prev.map(img =>
              img.id === imageData.id
                ? {
                    ...img,
                    url: downloadURL,
                    status: 'completed' as const,
                    uploadProgress: 100
                  }
                : img
            )
          )

          URL.revokeObjectURL(imageData.preview)
        } catch (error) {
          isInternalUpdate.current = true
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
          setImages(prev =>
            prev.map(img =>
              img.id === imageData.id
                ? {
                    ...img,
                    status: 'error' as const,
                    error: errorMessage,
                    uploadProgress: 0
                  }
                : img
            )
          )

          toast.error(`Error al subir ${imageData.file.name}: ${errorMessage}`)
        }
      } catch (error) {
        console.error('Upload failed:', error)
      }
    }
  }

  const removeImage = async (index: number) => {
    const imageToRemove = images[index]

    if (imageToRemove.url && imageToRemove.status === 'completed') {
      try {
        await StorageService.deleteImage(imageToRemove.url)
        toast.success(`Imagen ${imageToRemove.name} eliminada`)
      } catch (error) {
        console.error('Error deleting image from storage:', error)
        toast.error(`Error al eliminar ${imageToRemove.name} del almacenamiento`)
      }
    }

    if (imageToRemove.preview && imageToRemove.preview.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.preview)
    }

    isInternalUpdate.current = true
    const updatedImages = images.filter((_, i) => i !== index)
    setImages(updatedImages)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    addImages(files)
    e.target.value = ""
  }

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        className={cn(
          "relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30"
        )}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        <div className="flex flex-col items-center gap-3 p-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Arrastra y suelta imágenes aquí
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              o haz clic para seleccionar archivos
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, GIF hasta 10MB ({images.length}/{maxImages})
          </p>
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
            >
              {image.url || image.preview ? (
                <img
                  src={image.url || image.preview}
                  alt={`Preview ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-muted">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity">
                {image.status === 'uploading' && (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-xs text-primary font-medium">
                      Subiendo...
                    </span>
                  </div>
                )}

                {image.status === 'completed' && (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <span className="text-xs text-green-500 font-medium">Completado</span>
                  </div>
                )}

                {image.status === 'error' && (
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                    <span className="text-xs text-destructive font-medium">Error</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground transition-transform hover:scale-110"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>

              <div className="absolute bottom-2 left-2 right-2">
                <p className="truncate rounded bg-background/80 px-2 py-1 text-xs text-foreground">
                  {image.name}
                </p>
              </div>
            </div>
          ))}

          {images.length < maxImages && (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary/50 hover:bg-muted/50">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <span className="mt-2 text-xs text-muted-foreground">Agregar</span>
            </label>
          )}
        </div>
      )}
    </div>
  )
}
