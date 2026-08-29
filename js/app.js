let datosTuristicos = [];

// Elementos del DOM
const contenedor = document.getElementById('contenedorTarjetas');
const contador = document.getElementById('contadorResultados');
const buscarInput = document.getElementById('buscarInput');
const filtroCiudad = document.getElementById('filtroCiudad');
const filtroCosto = document.getElementById('filtroCosto');

// Inicialización de Leaflet
let map;
let markersLayer;

function inicializarMapa() {
  if (!document.getElementById('mapa')) return;

  map = L.map('mapa').setView([-33.08, -71.42], 10);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
}

// Paleta de colores por ciudad para los badges
const coloresCiudad = {
  "Viña del Mar": "bg-sky-50 text-sky-700 border-sky-200",
  "Valparaíso": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Casablanca": "bg-purple-50 text-purple-700 border-purple-200",
  "Concón": "bg-teal-50 text-teal-700 border-teal-200",
  "Quilpué": "bg-amber-50 text-amber-700 border-amber-200",
  "Olmué": "bg-emerald-50 text-emerald-700 border-emerald-200"
};

// Cargar datos JSON con Fetch API
async function cargarLugares() {
  try {
    const respuesta = await fetch('data/lugares.json');
    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`);
    }
    datosTuristicos = await respuesta.json();
    renderizarTarjetas(datosTuristicos);
    actualizarMapa(datosTuristicos);
  } catch (error) {
    console.error('Error al cargar los datos turísticos:', error);
    contador.textContent = 'Error al cargar los lugares.';
    contenedor.innerHTML = `
      <div class="col-span-full py-12 text-center text-rose-500">
        <p class="font-semibold">No se pudo cargar el archivo data/lugares.json.</p>
        <p class="text-xs text-slate-500 mt-1">Si abres el archivo localmente, asegúrate de usar un servidor local (Live Server o npx serve) para evitar restricciones CORS.</p>
      </div>
    `;
  }
}

// Actualizar marcadores en el mapa
function actualizarMapa(lugares) {
  markersLayer.clearLayers();
  lugares.forEach(lugar => {
    const marker = L.marker([lugar.coordenadas.lat, lugar.coordenadas.lng]);
    marker.bindPopup(`
      <div class="p-1">
        <h3 class="font-bold text-sm text-slate-900">${lugar.nombre}</h3>
        <p class="text-xs text-slate-600 mb-2">${lugar.ciudad} &bull; ${lugar.añoConstruccion}</p>
        <a href="${lugar.googleMapsUrl}" target="_blank" class="inline-block text-xs font-semibold text-sky-600 hover:text-sky-800">
          ¿Cómo llegar? &rarr;
        </a>
      </div>
    `);
    markersLayer.addLayer(marker);
  });
}

// Renderizar tarjetas dinámicas
function renderizarTarjetas(lugares) {
  contenedor.innerHTML = '';
  contador.textContent = `Mostrando ${lugares.length} ${lugares.length === 1 ? 'lugar' : 'lugares'}`;

  if (lugares.length === 0) {
    contenedor.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-500">
        <i data-lucide="map-pin-off" class="w-10 h-10 mx-auto mb-3 text-slate-400"></i>
        <p class="text-base font-semibold">No se encontraron resultados</p>
        <p class="text-sm">Prueba ajustando los filtros de búsqueda.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  lugares.forEach(lugar => {
    const tarjeta = document.createElement('article');
    tarjeta.className = "bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition duration-200";

    const badgeCostoColor = lugar.esGratis 
      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
      : "bg-amber-50 text-amber-700 border-amber-200";

    const badgeCiudadColor = coloresCiudad[lugar.ciudad] || "bg-slate-50 text-slate-700 border-slate-200";

    tarjeta.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between gap-2 mb-3">
          <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badgeCiudadColor}">
            ${lugar.ciudad}
          </span>
          <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badgeCostoColor}">
            ${lugar.precio.includes('Gratis') ? 'Gratis' : 'De Pago'}
          </span>
        </div>

        <h3 class="text-lg font-bold text-slate-900 mb-1 leading-snug">${lugar.nombre}</h3>
        <p class="text-xs font-medium text-slate-500 mb-3">${lugar.categoria} &bull; Construcción: <strong>${lugar.añoConstruccion}</strong></p>
        
        <p class="text-sm text-slate-600 mb-4 leading-relaxed">${lugar.descripcionHistorica}</p>

        <div class="pt-3 border-t border-slate-100 text-xs text-slate-500 flex flex-col gap-1.5 mb-2">
          <div class="flex items-center gap-2">
            <i data-lucide="clock" class="w-3.5 h-3.5 text-slate-400"></i>
            <span>${lugar.horario}</span>
          </div>
          <div class="flex items-center gap-2">
            <i data-lucide="ticket" class="w-3.5 h-3.5 text-slate-400"></i>
            <span>${lugar.precio}</span>
          </div>
        </div>
      </div>

      <div class="p-4 bg-slate-50 border-t border-slate-100 mt-auto">
        <a href="${lugar.googleMapsUrl}" target="_blank" rel="noopener noreferrer" 
           class="w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-sky-700 text-white text-xs font-medium rounded-lg transition-colors duration-150">
          <i data-lucide="navigation" class="w-3.5 h-3.5"></i>
          ¿Cómo llegar con Google Maps?
        </a>
      </div>
    `;
    contenedor.appendChild(tarjeta);
  });

  lucide.createIcons();
}

// Filtrado reactivo
function filtrarDatos() {
  const texto = buscarInput.value.toLowerCase();
  const ciudadSeleccionada = filtroCiudad.value;
  const costoSeleccionado = filtroCosto.value;

  const resultados = datosTuristicos.filter(lugar => {
    const coincideTexto = lugar.nombre.toLowerCase().includes(texto) ||
                          lugar.descripcionHistorica.toLowerCase().includes(texto) ||
                          lugar.categoria.toLowerCase().includes(texto);

    const coincideCiudad = ciudadSeleccionada === 'todas' || lugar.ciudad === ciudadSeleccionada;

    let coincideCosto = true;
    if (costoSeleccionado === 'gratis') coincideCosto = lugar.esGratis;
    if (costoSeleccionado === 'pago') coincideCosto = !lugar.esGratis;

    return coincideTexto && coincideCiudad && coincideCosto;
  });

  renderizarTarjetas(resultados);
  actualizarMapa(resultados);
}

// Listeners
buscarInput.addEventListener('input', filtrarDatos);
filtroCiudad.addEventListener('change', filtrarDatos);
filtroCosto.addEventListener('change', filtrarDatos);

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  inicializarMapa();
  cargarLugares();
});