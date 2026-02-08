# Mapa de Lotes - Proyecto Inmobiliario

Este proyecto es un mapa interactivo para visualizar la disponibilidad de lotes en venta.

## Características

*   **Mapa Interactivo**: Basado en Leaflet.
*   **Diseño Premium**: Estilo "Hacienda" con colores elegantes.
*   **Integración WhatsApp**: Botón flotante que detecta qué lote le interesa al cliente.
*   **Integración Google Sheets (CRM)**: Preparado para conectar con una hoja de cálculo.

## Cómo Subir a GitHub

1.  Crea un nuevo repositorio en GitHub.
2.  Sube todos los archivos de esta carpeta.
3.  Ve a **Settings > Pages** en tu repositorio de GitHub.
4.  En "Source", selecciona la rama `main` y la carpeta `root`.
5.  ¡Listo! Tu mapa estará visible en `https://tu-usuario.github.io/tu-repo/`.

## Integración con Google Sheets

Para que el mapa actualice los colores (Vendido/Disponible) automáticamente desde Excel:

1.  Publica tu Google Sheet en **Archivo > Compartir > Publicar en la web**.
2.  Selecciona formato **CSV**.
3.  Copia el enlace generado.
4.  Abre el archivo `js/sheets_integration.js` y pega el enlace donde dice `YOUR_SHEET_CSV_URL`.
