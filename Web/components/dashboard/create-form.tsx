"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ImageUpload } from "./image-upload"
import { Save, Send, RotateCcw, FileText, Image, Settings2, Info, CheckCircle2, Loader2 } from "lucide-react"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { useAuth } from "@/hooks/use-auth"
import { FirestoreService } from "@/lib/firestore"
import { ImageData } from "@/lib/storage"
import { toast } from "sonner"
import { db } from "@/lib/firebase"

export function CreateForm() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    console.log("🔥 Firebase connection test:")
    console.log("- User authenticated:", !!user)
    console.log("- User ID:", user?.uid)
    console.log("- Firebase project:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
    console.log("- Firestore available:", !!db)
  }, [user])
  const [priority, setPriority] = useState([50])
  const [isPublic, setIsPublic] = useState(false)
  const [enableNotifications, setEnableNotifications] = useState(true)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [images, setImages] = useState<ImageData[]>([])
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    eventType: "",
    description: "",
    actionTaken: "",
    email: "",
    phone: "",
    date: "",
    notes: "",
    assignee: "",
    team: "",
    projectStatus: "active",
    permissions: {
      edit: false,
      comment: false,
      download: false,
      share: false,
    },
  })

  const availableTags = ["Urgente", "Revisión", "Aprobado", "Pendiente", "Archivado"]

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [permission]: checked },
    }))
  }

  const handleImagesChange = (newImages: ImageData[]) => {
    setImages(newImages)
  }

  const handleSaveDraft = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión para guardar")
      return
    }

    setIsLoading(true)
    try {
      const recordData = {
        ...formData,
        tags: selectedTags,
        priority: priority[0],
        isPublic,
        enableNotifications,
        status: "draft",
        images: images.map(img => ({
          url: img.url,
          name: img.name,
          size: img.size,
        })),
        userId: user.uid,
        userEmail: user.email,
      }

      await FirestoreService.create("records", recordData)
      toast.success("Borrador guardado exitosamente")
    } catch (error) {
      console.error("Error saving draft:", error)
      toast.error("Error al guardar el borrador")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión para publicar")
      return
    }

    if (!formData.title || !formData.category || !formData.eventType || !formData.date || !formData.description || !formData.actionTaken) {
      toast.error("Título, ubicación, tipo de evento, fecha, descripción y acción tomada son obligatorios")
      return
    }

    setIsLoading(true)

    try {
      console.log("🔥 Iniciando guardado en Firebase...")
      console.log("👤 Usuario autenticado:", user.uid, user.email)
      console.log("📝 Datos del formulario:", formData)

      const recordData = {
        ...formData,
        tags: selectedTags,
        priority: priority[0],
        isPublic,
        enableNotifications,
        status: "published",
        images: images.map(img => ({
          url: img.url,
          name: img.name,
          size: img.size,
        })),
        userId: user.uid,
        userEmail: user.email,
      }

      console.log("💾 Datos a guardar:", recordData)

      const docId = await FirestoreService.create("records", recordData)

      console.log("✅ Registro guardado exitosamente con ID:", docId)
      toast.success("Registro publicado exitosamente")

      setFormData({
        title: "",
        category: "",
        description: "",
        email: "",
        phone: "",
        date: "",
        notes: "",
        assignee: "",
        team: "",
        projectStatus: "active",
        permissions: {
          edit: false,
          comment: false,
          download: false,
          share: false,
        },
      })
      setSelectedTags([])
      setImages([])
      setPriority([50])
      setIsPublic(false)
      setEnableNotifications(true)

    } catch (error) {
      console.error("❌ Error detallado al publicar registro:", error)

      if (error && typeof error === 'object' && 'code' in error) {
        switch (error.code) {
          case 'permission-denied':
            toast.error("No tienes permisos para guardar. Revisa las reglas de Firestore.")
            console.error("🚫 Error de permisos - Revisa las reglas de seguridad en Firebase Console")
            break
          case 'unavailable':
            toast.error("Servicio no disponible. Revisa tu conexión a internet.")
            break
          case 'deadline-exceeded':
            toast.error("Tiempo de espera agotado. Intenta de nuevo.")
            break
          case 'resource-exhausted':
            toast.error("Límite de cuota excedido.")
            break
          default:
            toast.error(`Error de Firebase: ${error.code}`)
            console.error("🔥 Código de error de Firebase:", error.code)
        }
      } else {
        toast.error("Error desconocido al guardar. Revisa la consola.")
      }

      console.error("📋 Información de debugging:")
      console.error("- Usuario:", user ? { uid: user.uid, email: user.email } : "No autenticado")
      console.error("- Proyecto Firebase:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
      console.error("- Error completo:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-2 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Nuevo Registro</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete todos los campos requeridos para crear un nuevo registro
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 border-primary/30 text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Borrador
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-0">
        <div className="w-full overflow-x-auto scrollbar-hide">
          <TabsList className="inline-flex h-10 min-w-full items-center justify-start rounded-md bg-muted p-1 text-muted-foreground">
            <TabsTrigger value="general" className="flex-shrink-0 gap-2 px-3 py-1.5">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
              <span className="sm:hidden">Gen</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="flex-shrink-0 gap-2 px-3 py-1.5">
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">Multimedia</span>
              <span className="sm:hidden">Media</span>
            </TabsTrigger>
            <TabsTrigger value="options" className="flex-shrink-0 gap-2 px-3 py-1.5">
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Opciones</span>
              <span className="sm:hidden">Opc</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex-shrink-0 gap-2 px-3 py-1.5">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">Avanzado</span>
              <span className="sm:hidden">Adv</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="general" className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Información Básica
              </CardTitle>
              <CardDescription>
                Datos principales del registro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid gap-6 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="title">Título *</FieldLabel>
                    <Input
                      id="title"
                      placeholder="Ingrese el título del registro"
                      className="bg-input"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="category">Ubicación *</FieldLabel>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleInputChange("category", value)}
                    >
                      <SelectTrigger className="bg-input">
                        <SelectValue placeholder="Seleccione una ubicación" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pozo">Pozo</SelectItem>
                        <SelectItem value="base">Base</SelectItem>
                        <SelectItem value="oficina">Oficina</SelectItem>
                        <SelectItem value="movilizacion">Movilización</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="eventType">Tipo de evento *</FieldLabel>
                  <Select
                    value={formData.eventType}
                    onValueChange={(value) => handleInputChange("eventType", value)}
                  >
                    <SelectTrigger className="bg-input">
                      <SelectValue placeholder="Seleccione el tipo de evento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="acto-inseguro">Acto inseguro</SelectItem>
                      <SelectItem value="condicion-insegura">Condición insegura</SelectItem>
                      <SelectItem value="oportunidad-mejora">Oportunidad de mejora</SelectItem>
                      <SelectItem value="felicitaciones">Felicitaciones / Refuerzo positivo</SelectItem>
                      
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="description">Descripción *</FieldLabel>
                  <Textarea
                    id="description"
                    placeholder="Escriba una descripción detallada..."
                    rows={4}
                    className="resize-none bg-input"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="actionTaken">Acción tomada *</FieldLabel>
                  <Textarea
                    id="actionTaken"
                    placeholder="Describa las acciones tomadas..."
                    rows={3}
                    className="resize-none bg-input"
                    value={formData.actionTaken}
                    onChange={(e) => handleInputChange("actionTaken", e.target.value)}
                  />
                </Field>

                <div className="grid gap-6 md:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor="date">Fecha *</FieldLabel>
                    <Input
                      id="date"
                      type="date"
                      className="bg-input"
                      value={formData.date}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                    />
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Etiquetas</CardTitle>
              <CardDescription>
                Seleccione las etiquetas aplicables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                      selectedTags.includes(tag)
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-border bg-muted text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    {selectedTags.includes(tag) && (
                      <CheckCircle2 className="mr-1.5 inline h-4 w-4" />
                    )}
                    {tag}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-card p-4">
            <Button variant="outline" className="gap-2 w-full sm:w-auto" disabled={isLoading}>
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Restablecer</span>
              <span className="sm:hidden">Reset</span>
            </Button>

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-3 w-full sm:w-auto">
              <Button
                variant="secondary"
                className="gap-2 w-full sm:w-auto"
                onClick={handleSaveDraft}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Guardar Borrador</span>
                <span className="sm:hidden">Borrador</span>
              </Button>
              <Button
                className="gap-2 w-full sm:w-auto"
                onClick={handlePublish}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Publicar Registro</span>
                <span className="sm:hidden">Publicar</span>
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="media" className="space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Image className="h-5 w-5 text-primary" />
                Subir Imágenes
              </CardTitle>
              <CardDescription>
                Agregue imágenes relacionadas con el registro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload
                maxImages={6}
                recordId={user?.uid || 'temp'}
                onImagesChange={handleImagesChange}
                value={images}
              />
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Archivos Adjuntos</CardTitle>
              <CardDescription>
                Documentos PDF, Word, Excel, etc.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex min-h-[120px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30">
                <FileText className="h-10 w-10 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Arrastra archivos aquí o haz clic para seleccionar
                </p>
                <Button variant="outline" className="mt-4" size="sm">
                  Seleccionar Archivos
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="options" className="space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings2 className="h-5 w-5 text-primary" />
                Configuración
              </CardTitle>
              <CardDescription>
                Ajuste las opciones del registro
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <Field>
                <FieldLabel>Prioridad: {priority[0]}%</FieldLabel>
                <Slider
                  value={priority}
                  onValueChange={setPriority}
                  max={100}
                  step={1}
                  className="mt-3"
                />
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>Baja</span>
                  <span>Media</span>
                  <span>Alta</span>
                </div>
              </Field>

              <div className="space-y-4">
                <FieldLabel>Estado del proyecto</FieldLabel>
                <RadioGroup
                  value={formData.projectStatus}
                  onValueChange={(value) => handleInputChange("projectStatus", value)}
                  className="grid gap-3"
                >
                  {[
                    { value: "active", label: "Activo", desc: "El proyecto está en curso" },
                    { value: "paused", label: "Pausado", desc: "Temporalmente detenido" },
                    { value: "completed", label: "Completado", desc: "Proyecto finalizado" },
                    { value: "cancelled", label: "Cancelado", desc: "Proyecto cancelado" },
                  ].map((option) => (
                    <div key={option.value} className="flex items-start gap-3">
                      <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                      <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                        <span className="font-medium text-foreground">{option.label}</span>
                        <p className="text-sm text-muted-foreground">{option.desc}</p>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Visibilidad pública</p>
                    <p className="text-sm text-muted-foreground">
                      Permitir que otros usuarios vean este registro
                    </p>
                  </div>
                  <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Notificaciones</p>
                    <p className="text-sm text-muted-foreground">
                      Recibir alertas sobre cambios
                    </p>
                  </div>
                  <Switch
                    checked={enableNotifications}
                    onCheckedChange={setEnableNotifications}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6 max-h-[50vh] md:max-h-[80vh] overflow-y-auto scrollbar-hide">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="h-5 w-5 text-primary" />
                Opciones Avanzadas
              </CardTitle>
              <CardDescription>
                Configuraciones adicionales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <FieldLabel>Permisos</FieldLabel>
                <div className="space-y-3">
                  {[
                    { id: "edit", label: "Permitir edición", desc: "Los colaboradores pueden modificar" },
                    { id: "comment", label: "Permitir comentarios", desc: "Habilitar discusiones" },
                    { id: "download", label: "Permitir descargas", desc: "Los usuarios pueden descargar archivos" },
                    { id: "share", label: "Permitir compartir", desc: "Generar enlaces para compartir" },
                  ].map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3"
                    >
                      <Checkbox
                        id={permission.id}
                        checked={formData.permissions[permission.id as keyof typeof formData.permissions]}
                        onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                        className="mt-0.5"
                      />
                      <Label htmlFor={permission.id} className="flex-1 cursor-pointer">
                        <span className="font-medium text-foreground">{permission.label}</span>
                        <p className="text-sm text-muted-foreground">{permission.desc}</p>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="assignee">Responsable</FieldLabel>
                  <Select
                    value={formData.assignee}
                    onValueChange={(value) => handleInputChange("assignee", value)}
                  >
                    <SelectTrigger className="bg-input">
                      <SelectValue placeholder="Seleccionar usuario" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user1">María García</SelectItem>
                      <SelectItem value="user2">Carlos López</SelectItem>
                      <SelectItem value="user3">Ana Martínez</SelectItem>
                      <SelectItem value="user4">Pedro Sánchez</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="team">Equipo</FieldLabel>
                  <Select
                    value={formData.team}
                    onValueChange={(value) => handleInputChange("team", value)}
                  >
                    <SelectTrigger className="bg-input">
                      <SelectValue placeholder="Seleccionar equipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dev">Desarrollo</SelectItem>
                      <SelectItem value="design">Diseño</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="sales">Ventas</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="notes">Notas internas</FieldLabel>
                  <Textarea
                    id="notes"
                    placeholder="Notas privadas solo visibles para administradores..."
                    rows={3}
                    className="resize-none bg-input"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                  />
                </Field>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
