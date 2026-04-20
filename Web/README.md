# Dashboard con Firebase

Una aplicación de dashboard moderna construida con Next.js 16, TypeScript, Tailwind CSS y Firebase.

## 🚀 Características

- **Autenticación completa**: Login, registro y Google Sign-In
- **Base de datos en tiempo real**: Firestore para almacenar registros
- **UI moderna**: Componentes de shadcn/ui con tema oscuro
- **Formularios avanzados**: Validación, subida de imágenes, permisos
- **Responsive**: Funciona en desktop y móvil

## 🛠️ Tecnologías

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI**: Tailwind CSS, shadcn/ui, Radix UI
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Estado**: Context API, Custom Hooks
- **Linter**: ESLint, Prettier

## 📦 Instalación

1. **Clona el repositorio**:
   ```bash
   git clone <tu-repo>
   cd <tu-repo>
   ```

2. **Instala dependencias**:
   ```bash
   npm install
   ```

3. **Configura Firebase**:
   - Ve a [Firebase Console](https://console.firebase.google.com/)
   - Crea un nuevo proyecto
   - Habilita Authentication y Firestore
   - Copia las credenciales en `.env.local`

4. **Variables de entorno** (`.env.local`):
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=tu_measurement_id
   ```

5. **Ejecuta la aplicación**:
   ```bash
   npm run dev
   ```

## 🔧 Configuración de Firebase

### 1. Authentication
- Ve a Authentication → Sign-in method
- Habilita: Email/Password y Google

### 2. Firestore Database
- Ve a Firestore Database → Crear base de datos
- Elige "Comenzar en modo de prueba" (para desarrollo)

### 3. Storage (opcional)
- Para subir imágenes, habilita Cloud Storage

## 📁 Estructura del Proyecto

```
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Layout principal con providers
│   └── page.tsx           # Página principal
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes base (shadcn/ui)
│   ├── dashboard/        # Componentes del dashboard
│   └── auth-form.tsx     # Formulario de autenticación
├── hooks/                # Custom hooks
│   ├── use-auth.ts       # Hook de autenticación
│   └── use-toast.ts      # Hook de notificaciones
├── lib/                  # Utilidades
│   ├── firebase.ts       # Configuración de Firebase
│   ├── firestore.ts      # Servicios de Firestore
│   └── utils.ts          # Funciones auxiliares
└── .env.local           # Variables de entorno (no subir)
```

## 🎯 Uso de Firebase

### Autenticación
```typescript
import { useAuth } from '@/hooks/use-auth'

function MyComponent() {
  const { user, signIn, signUp, logout } = useAuth()

  // El hook proporciona:
  // - user: Usuario actual
  // - signIn(email, password)
  // - signUp(email, password, displayName)
  // - signInWithGoogle()
  // - logout()
}
```

### Firestore
```typescript
import { FirestoreService } from '@/lib/firestore'

// Crear un registro
await FirestoreService.create('records', {
  title: 'Mi registro',
  description: 'Descripción...',
  userId: user.uid
})

// Obtener todos los registros
const records = await FirestoreService.getAll('records')

// Escuchar cambios en tiempo real
const unsubscribe = FirestoreService.subscribeToCollection(
  'records',
  (records) => console.log(records)
)
```

## 🚦 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construir para producción
- `npm run start` - Ejecutar en producción
- `npm run lint` - Verificar código con ESLint

## 🔒 Seguridad

- Las variables de entorno están protegidas en `.gitignore`
- Autenticación requerida para acciones sensibles
- Validación de formularios en cliente y servidor
- Reglas de Firestore para control de acceso

## 📝 Próximos Pasos

- [ ] Implementar roles de usuario
- [ ] Agregar sistema de notificaciones
- [ ] Implementar subida de archivos a Storage
- [ ] Agregar analíticas y reportes
- [ ] Implementar búsqueda y filtros avanzados

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.