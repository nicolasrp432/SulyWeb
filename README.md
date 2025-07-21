# Suly Pretty Nails - Sitio Web

Este es el sitio web oficial de Suly Pretty Nails, un salón de belleza especializado en servicios de manicura y pedicura.

## Características

- Diseño moderno y responsivo
- Secciones para servicios, galería, reservas y contacto
- Integración con CommonNinja para mostrar reseñas de Google y mapas interactivos
- Botón de WhatsApp para contacto directo
- Animaciones suaves con Framer Motion

## Tecnologías Utilizadas

- React.js
- Vite
- Tailwind CSS
- Framer Motion para animaciones
- React Router para navegación
- CommonNinja para widgets de reseñas y mapas

## Configuración

### Requisitos Previos

- Node.js (versión 14 o superior)
- npm o yarn

### Instalación

1. Clona este repositorio
2. Instala las dependencias:

```bash
npm install
# o
yarn install
```

3. Inicia el servidor de desarrollo:

```bash
npm run dev
# o
yarn dev
```

4. Abre tu navegador en `http://localhost:5173`

## Configuración de Widgets de CommonNinja

Este proyecto utiliza widgets de CommonNinja para mostrar reseñas de Google y mapas interactivos sin necesidad de una API key de Google Maps. Para configurar estos widgets, consulta el archivo [COMMONNINJA_SETUP.md](./COMMONNINJA_SETUP.md) que contiene instrucciones detalladas.

## Estructura del Proyecto

```
/src
  /components       # Componentes reutilizables
  /contexts         # Contextos de React
  /lib              # Utilidades y funciones auxiliares
  /pages            # Páginas principales
  App.jsx           # Componente principal
  main.jsx          # Punto de entrada
```

## Personalización

### Colores y Estilos

Los colores y estilos principales se pueden modificar en el archivo `tailwind.config.js`.

### Contenido

El contenido de las páginas se puede modificar directamente en los archivos correspondientes dentro de la carpeta `/pages`.

## Despliegue

Para construir la versión de producción:

```bash
npm run build
# o
yarn build
```

Los archivos generados estarán en la carpeta `dist` y pueden ser desplegados en cualquier servidor web estático.

## Soporte

Para cualquier consulta o problema, por favor contacta al desarrollador o crea un issue en este repositorio.

## Licencia

Todos los derechos reservados - Suly Pretty Nails