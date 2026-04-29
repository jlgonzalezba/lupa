# Reglas del Proyecto

## Estructura del Proyecto

| Subproyecto | Ruta | Descripcion |
|-------------|------|-------------|
| **Web** | `Web/` | Aplicacion web Next.js |
| **App Movil** | `lupa_app/` | Aplicacion movil Flutter |
| **Functions** | `functions/` | Firebase Cloud Functions |

## Usuarios

### Roles
- **Usuarios generales**: Usuarios comunes de la aplicacion
- **Usuarios admin**: Administradores con acceso total
- El usuario admin tiene acceso a la pagina "usuarios" tanto en web como en movil, el usuario general no.

### Creacion de usuarios
Solo el usuario admin puede crear nuevos usuarios.
- El unico metodo de autenticacion es correo/contraseña
- Cuando el admin crea un se le asigna una clave temporal, la cual se debe cambiar al primer inicio de sesion
- En la **pagina web**: Ir a "Usuarios" en el menu izquierdo
- En la **app movil**: Ir a "Usuarios" en el icono hamburger (menu)

### Gestion
Los usuarios estan gestionados con **Firebase** (Authentication y Firestore).

## Variables de Entorno Criticas

### Firebase Admin (Web/lib/firebase-admin.ts)
- `FIREBASE_ADMIN_CLIENT_EMAIL`: Service account email
- `FIREBASE_ADMIN_PRIVATE_KEY`: Private key para Firebase Admin SDK

**IMPORTANTE**: 
- La key privada debe tener saltos de linea REALES, NO escapados `\n`
- En Vercel: pegar con saltos de linea reales, no con `\n`
- En desarrollo local (.env.local): usar `\n` escapados

### Diagnostic
- Endpoint: `GET /api/diagnostic` para verificar estado de Firebase Admin
- Debe mostrar `"status": "SUCCESS"` con `adminAuthInitialized: true`

## URLs de la App
- Web desplegada: https://lupa-puce.vercel.app
- Mobile API Base: https://lupa-puce.vercel.app
- Proyecto Firebase: innergy-a55ba

## Antes de Deploy
1. Verificar que `.env.local` no se suba (ya esta en .gitignore)
2. Para Vercel: configurar `FIREBASE_ADMIN_CLIENT_EMAIL` y `FIREBASE_ADMIN_PRIVATE_KEY`
3. Hacer Redeploy despues de cambiar env vars