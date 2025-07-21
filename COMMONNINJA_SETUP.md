# Configuración de Widgets de CommonNinja

Este documento explica cómo configurar los widgets de CommonNinja para reseñas de Google y mapas interactivos en tu sitio web.

## Índice

1. [Introducción](#introducción)
2. [Configuración del Widget de Reseñas](#configuración-del-widget-de-reseñas)
3. [Configuración del Widget de Mapa](#configuración-del-widget-de-mapa)
4. [Personalización de los Widgets](#personalización-de-los-widgets)
5. [Consideraciones Importantes](#consideraciones-importantes)

## Introducción

CommonNinja es una plataforma que ofrece widgets interactivos para sitios web sin necesidad de codificación. En este proyecto, hemos integrado dos widgets de CommonNinja:

- **Widget de Reseñas de Google**: Muestra las reseñas de tu negocio en Google.
- **Widget de Mapa Interactivo**: Muestra la ubicación de tu negocio en un mapa interactivo.

La ventaja principal de usar CommonNinja es que no necesitas una API key de Google Maps, lo que simplifica la configuración y reduce los costos.

## Configuración del Widget de Reseñas

El widget de reseñas ya está configurado con un ID de ejemplo. Para configurarlo con tus propias reseñas, sigue estos pasos:

1. Visita [CommonNinja](https://www.commoninja.com/) y crea una cuenta gratuita.
2. En el catálogo de widgets, busca y selecciona "Google Reviews".
3. Configura el widget con la URL de tu negocio en Google:
   - Busca tu negocio en Google
   - Haz clic en la sección de mapa
   - Navega a la pestaña "Reseñas" y luego vuelve a "Información general" en Google Maps
   - Copia la URL desde la barra de direcciones del navegador
   - Pega esta URL en el editor de CommonNinja
4. Personaliza el aspecto del widget según tus preferencias.
5. Guarda los cambios haciendo clic en el botón "Save Changes" en la esquina superior derecha.
6. Haz clic en el botón "Add to Website" (representado por el símbolo "</>").
7. Copia el ID del widget (aparece después de "pid-" en el código).
8. Abre el archivo `src/components/CommonNinjaReviews.jsx` y reemplaza el ID existente con tu nuevo ID.

## Configuración del Widget de Mapa

El widget de mapa está configurado con un placeholder que debes reemplazar. Sigue estos pasos:

1. Visita [CommonNinja](https://www.commoninja.com/) y accede a tu cuenta.
2. En el catálogo de widgets, busca y selecciona "Interactive Map".
3. Configura el mapa con la ubicación de tu negocio:
   - Añade marcadores para tus ubicaciones
   - Configura la información que aparecerá al hacer clic en los marcadores
   - Ajusta el nivel de zoom y el centro del mapa
4. Personaliza el aspecto del mapa según tus preferencias.
5. Guarda los cambios haciendo clic en el botón "Save Changes".
6. Haz clic en el botón "Add to Website" (representado por el símbolo "</>").
7. Copia el ID del widget (aparece después de "pid-" en el código).
8. Abre los siguientes archivos y reemplaza `pid-REEMPLAZAR-CON-TU-ID` con tu nuevo ID:
   - `src/components/CommonNinjaMap.jsx`
   - `src/pages/Contact.jsx`

## Personalización de los Widgets

Puedes personalizar los widgets directamente desde el panel de control de CommonNinja:

1. Inicia sesión en tu cuenta de CommonNinja.
2. Ve a la sección "Widgets" en el panel de control.
3. Selecciona el widget que deseas personalizar.
4. Realiza los cambios deseados en el editor.
5. Guarda los cambios.

Los cambios se reflejarán automáticamente en tu sitio web sin necesidad de modificar el código.

## Consideraciones Importantes

- **Plan Gratuito**: CommonNinja ofrece un plan gratuito con limitaciones en el número de vistas. Si tu sitio tiene mucho tráfico, considera actualizar a un plan de pago.
- **Rendimiento**: Los widgets se cargan desde servidores externos, lo que puede afectar ligeramente el tiempo de carga de tu página.
- **Personalización**: Aunque los widgets son altamente personalizables, algunas opciones avanzadas pueden requerir un plan de pago.
- **Compatibilidad**: Los widgets son compatibles con todos los navegadores modernos y son responsivos para dispositivos móviles.
- **Actualizaciones**: CommonNinja actualiza regularmente sus widgets. Estas actualizaciones se aplican automáticamente sin necesidad de cambios en tu código.

---

Para más información y soporte, visita [CommonNinja Help Center](https://help.commoninja.com/).