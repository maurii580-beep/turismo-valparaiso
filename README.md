# 🧭 Nomada Tour | Región de Valparaíso

Aplicación web orientada al turismo patrimonial, diseñada bajo estrictos estándares de usabilidad móvil (WCAG). Permite a los usuarios explorar hitos históricos, parques nacionales y monumentos en Valparaíso, Viña del Mar, Concón, Quilpué, Olmué y Casablanca[cite: 1].

## ✨ Características de la Plataforma
* **Centro de Control Unificado:** Interfaz optimizada sin selectores nativos, utilizando *chips* de desplazamiento horizontal para una navegación a un solo toque.
* **Mapa Defensivo:** Integración de mapa interactivo con protección de gestos táctiles para evitar atascos en la pantalla móvil (*scroll trap*).
* **Fichas Informativas Enriquecidas:** Tarjetas detalladas que incluyen historia, logística, un "Dato Curioso" y sistema de colores dinámicos para validación de accesibilidad (sillas de ruedas)[cite: 1].
* **Modo Oscuro/Claro:** Adaptación visual automática y manual para mejorar la legibilidad bajo la luz del sol.

## 🛠️ Stack Tecnológico
* **Core:** HTML5 semántico y JavaScript Moderno (ES6+, Fetch API)[cite: 1].
* **Estilos:** Tailwind CSS implementado vía CDN[cite: 1].
* **Mapas e Íconos:** Leaflet.js, OpenStreetMap y Lucide Icons[cite: 1].
* **Base de Datos Estática:** Consumo asíncrono de un archivo estructurado `lugares.json`[cite: 1].
* **Integraciones:** Generador automático de imágenes de respaldo (Placehold) y gestión de formularios de contacto vía Formspree.

## 🚀 Despliegue y Desarrollo Local
* **Entorno de Desarrollo:** Ejecuta la aplicación usando Live Server (VS Code) o mediante el comando `npx serve` para evitar bloqueos CORS al consumir los datos[cite: 1].
* **Producción:** Despliegue automatizado y gratuito conectando la rama principal del repositorio de GitHub con Vercel[cite: 1].
* **SEO y Compartición:** Incorpora etiquetas *Open Graph* para garantizar vistas previas profesionales al enviar la aplicación por WhatsApp o redes sociales[cite: 1].

## 📁 Estructura del proyecto

```text
turismo-valparaiso/
├── index.html
├── css/
│   └── styles.css
├── data/
│   └── lugares.json
├── img/
├── js/
│   └── app.js
├── README.md
└── .gitignore
```

{
  "id": "nombre-del-lugar-sin-espacios",
  "nombre": "Nombre Oficial Completo",
  "ciudad": "Viña del Mar",
  "categoria": "Categoría Principal (Ej: Monumento Público)",
  "añoConstruccion": 1900,
  "descripcionHistorica": "Párrafo breve con la historia principal del lugar.",
  "datoCurioso": "Una anécdota o dato poco conocido para la sección '¿Sabías que?'.",
  "precio": "Gratis o Valor estimado en CLP",
  "esGratis": true,
  "horario": "Días y horas de apertura",
  "imagen": "img/nombre-foto.jpg",
  "sitioWeb": "https://enlace-oficial.cl",
  "requisitoIngreso": "Opcional: Cédula, reserva previa, etc.",
  "infoAdicional": "Opcional: Consejos o recomendaciones de seguridad.",
  "coordenadas": {
    "lat": -33.000000,
    "lng": -71.000000
  },
  "googleMapsUrl": "https://www.google.com/maps/dir/?api=1&destination=LAT,LNG",
  "estacionamiento": "Pago en parquímetros / Gratis / No disponible",
  "accesoSillaRuedas": "Sí (detalle) / Parcial (detalle) / No"
}

## ▶️ Cómo usarlo

1. Clona o descarga este repositorio.
2. Abre la carpeta del proyecto.
3. Ejecuta el archivo `index.html` en un navegador.
4. Si deseas un entorno local más realista, puedes usar un servidor estático simple como:

```bash
python -m http.server 8000
```

Luego accede a:

```text
http://localhost:8000
```

---

## 📌 Estado actual

El proyecto se encuentra en una versión funcional y visualmente pulida, con enfoque en usabilidad móvil, atractivo turístico y experiencia de navegación más fluida.

---

## 📝 Licencia

Este proyecto se entrega como desarrollo web local para uso educativo y demostrativo.
