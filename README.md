# 🧭 Ruta Patrimonial — Región de Valparaíso

Plataforma web interactiva para descubrir y explorar los principales puntos de interés histórico, cultural y arquitectónico de la Región de Valparaíso (Viña del Mar, Valparaíso, Casablanca, Concón, Quilpué y Olmué).

El proyecto integra un mapa dinámico con geolocalización de hitos, fichas históricas detalladas, filtros reactivos y cálculo de rutas directas con Google Maps.

---

## 📸 Vista Previa

*(Agrega aquí una captura de pantalla de la aplicación una vez desplegada)*

---

## ✨ Características Principales

- **🗺️ Mapa Interactivo:** Visualización geográfica de todos los atractivos mediante Leaflet.js y OpenStreetMap.
- **🏛️ Fichas Histórico-Patrimoniales:** Detalle de año de construcción, contexto histórico, horarios y tarifas de acceso.
- **🔍 Filtros en Tiempo Real:**
  - Búsqueda por texto libre (nombre, época, descripción).
  - Filtrado por comuna (*Viña del Mar, Valparaíso, Casablanca, Concón, Quilpué, Olmué*).
  - Clasificación por tipo de ingreso (*Gratis* vs. *De Pago*).
- **📍 Navegación Asistida:** Enlaces parametrizados hacia Google Maps para trazar rutas desde la ubicación actual del usuario.
- **📱 Diseño Responsivo:** Interfaz adaptada a dispositivos móviles, tablets y escritorios con Tailwind CSS.
- **⚡ Arquitectura Ligera (Jamstack):** Datos desacoplados en formato JSON y renderizado modular con Vanilla JavaScript, optimizado para despliegues estáticos de alta velocidad.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:** HTML5 semántico, JavaScript moderno (ES6+, Fetch API, Async/Await).
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/) (CDN) y CSS3 personalizado.
- **Mapas:** [Leaflet.js](https://leafletjs.com/) + OpenStreetMap Tiles.
- **Iconografía:** [Lucide Icons](https://lucide.dev/).
- **Fuente de Datos:** JSON estructurado (`data/lugares.json`).
- **Despliegue:** [Vercel](https://vercel.com/).

---

## 📁 Estructura del Proyecto

```text
turismo-valparaiso/
├── index.html          # Estructura principal de la interfaz
├── css/
│   └── styles.css      # Estilos personalizados y ajustes de Leaflet
├── data/
│   └── lugares.json    # Base de datos con los puntos turísticos y metadatos
├── js/
│   └── app.js          # Lógica de carga asíncrona, mapa y filtrado interactivo
└── README.md           # Documentación del proyecto

📌 Datos Estructurados (Ejemplo de Hito)
Cada punto dentro de data/lugares.json cuenta con el siguiente esquema:

JSON
{
  "id": "castillo-wulff",
  "nombre": "Castillo Wulff",
  "ciudad": "Viña del Mar",
  "categoria": "Arquitectura Patrimonial",
  "añoConstruccion": 1906,
  "descripcionHistorica": "Mandado a construir por el empresario Gustavo Wulff sobre roqueríos costeros...",
  "precio": "Gratis (área exterior)",
  "esGratis": true,
  "horario": "Martes a Domingo 10:00 a 18:00",
  "coordenadas": {
    "lat": -33.021111,
    "lng": -71.565833
  },
  "googleMapsUrl": "[https://www.google.com/maps/dir/?api=1&destination=-33.021111,-71.565833](https://www.google.com/maps/dir/?api=1&destination=-33.021111,-71.565833)"
}

📄 Licencia
Distribuido bajo la Licencia MIT. Consulta LICENSE para más información.