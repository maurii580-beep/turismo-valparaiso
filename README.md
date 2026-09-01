# 🧭 Ruta Patrimonial — Región de Valparaíso

Plataforma web interactiva para descubrir atractivos patrimoniales, culturales, naturales y urbanos de la Región de Valparaíso. El sitio reúne una guía visual de Viña del Mar, Valparaíso, Casablanca, Concón, Quilpué y Olmué con un enfoque turístico, histórico y amigable para celular.

El proyecto combina mapa, filtros interactivos, favoritos, geolocalización, sugerencias de usuarios y una experiencia visual compacta optimizada para mobile.

---

## 📸 Vista previa

La aplicación presenta una interfaz tipo guía turística con:
- mapa de localidades
- tarjetas de atractivos
- filtros por ciudad, categoría, precio y favoritos
- modo oscuro/claro
- diseño compacto y responsivo

---

## ✨ Mejoras incorporadas

- **🗺️ Mapa desplegable:** el mapa queda oculto por defecto y se puede abrir/ocultar con un botón más limpio para no saturar la vista en móvil.
- **🌗 Modo oscuro con toggle mejorado:** se implementó un selector visual con iconos de sol y luna y un comportamiento más moderno.
- **📱 Diseño adaptado para celulares:** reducción de espacio, alturas más compactas y mejor densidad visual en pantallas pequeñas.
- **🔍 Filtros más útiles:** búsqueda por texto, ciudad, categoría, tipo de ingreso y filtrado de favoritos.
- **📍 Cerca de mí:** opción para ordenar lugares según la ubicación del usuario.
- **💾 Favoritos persistentes:** los lugares guardados se mantienen en localStorage.
- **📤 Sugerir lugar:** modal de sugerencias con flujo para enviar un aporte al proyecto.
- **🔗 Compartir y acceso rápido:** botón para compartir la guía y abrir información relevante del sitio.
- **🎨 Visual premium:** ajustes de bordes, sombras, espaciado y estados activos para una apariencia más pulida.

---

## 🛠️ Tecnologías utilizadas

- **Frontend:** HTML5, JavaScript vanilla (ES6+)
- **Estilos:** Tailwind CSS CDN y CSS personalizado
- **Mapas:** Leaflet.js + OpenStreetMap
- **Iconografía:** Lucide Icons
- **Datos:** JSON estructurado en data/lugares.json
- **Persistencia:** localStorage

---

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

---

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
