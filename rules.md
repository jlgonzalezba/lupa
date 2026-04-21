# Reglas del Proyecto

## Estructura del Proyecto

El proyecto tiene dos subproyectos:
- **Web**: Aplicación web (ruta: `lupa/Web`)
- **App Móvil**: Aplicación móvil (ruta: `lupa/lupa_app`)

## Usuarios

### Roles
- **Usuarios generales**: Usuarios comunes de la aplicación
- **Usuarios admin**: Administradores con acceso total

### Creación de usuarios
Solo el usuario admin puede crear nuevos usuarios.
- En la **página web**: Ir a "Usuarios" en el menú izquierdo
- En la **app móvil**: Ir a "Usuarios" en el icono hamburger (menú)

### Gestión
Los usuarios están gestionados con **Firebase** (Authentication y Firestore).