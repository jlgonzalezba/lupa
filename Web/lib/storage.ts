export interface UploadProgress {
  status: string
}

export interface ValidationResult {
  valid: boolean
  error?: string
}

export interface ImageData {
  id: string
  file: File
  url?: string
  preview: string
  name: string
  size: number
  uploadProgress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
}

export class StorageService {
  static validateImageFile(file: File): ValidationResult {
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`
      }
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed'
      }
    }

    return { valid: true }
  }

  static async uploadImage(
    file: File,
    path: string,
    _onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      console.log(`🔥 Subiendo imagen: ${file.name} (${file.size} bytes)`)

      const pathParts = path.split('/')
      const userId = pathParts[1] || 'anonymous'
      const recordId = pathParts[2] || 'temp'

      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', userId)
      formData.append('recordId', recordId)

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Upload failed: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Imagen subida exitosamente:', data.url)

      return data.url
    } catch (error) {
      console.error('❌ Error al subir imagen:', error)
      throw error
    }
  }

  static async deleteImage(url: string): Promise<void> {
    try {
      console.log('🗑️ Eliminando imagen:', url)
      console.log('⚠️ Eliminación de imágenes no implementada aún')
    } catch (error) {
      console.error('❌ Error al eliminar imagen:', error)
      throw error
    }
  }
}