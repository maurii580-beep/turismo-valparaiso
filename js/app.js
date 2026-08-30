let datosTuristicos = [];
let soloFavoritosActivo = false;

// Cargar favoritos desde localStorage
let favoritos = JSON.parse(localStorage.getItem('rutas_favoritos')) || [];

// Elementos del DOM
const contenedor = document.getElementById('contenedorTarjetas');
const contador = document.getElementById('contadorResultados');
const buscarInput = document.getElementById('buscarInput');
const filtroCiudad = document.getElementById('filtroCiudad');
const filtroCosto = document.getElementById('filtroCosto');
const btnFiltroFavoritos = document.getElementById('btnFiltroFavoritos');
const contadorFavoritosBadge = document.getElementById('contadorFavoritosBadge');
const btnCompartir = document.getElementById('btnCompartir');

// Inicialización de Leaflet
const map = L.map('mapa').setView([-33.08, -71.42], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

let markersLayer = L.layerGroup().addTo(map);

// Colores de badges por comuna
const coloresCiudad = {
  "Viña del Mar": "bg-sky-50 text-sky-700 border-sky-200",
  "Valparaíso": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Casablanca": "bg-purple-50 text-purple-700 border-purple-200",
  "Concón": "bg-teal-50 text-teal-700 border-teal-200",
  "Quilpué": "bg-amber-50 text-amber-700 border-amber-200",
  "Olmué": "bg-emerald-50 text-emerald-700 border-emerald-200"
};

// Carga asíncrona de datos
async function cargarLugares() {
  try {
    const respuesta = await fetch('data/lugares.json');
    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`);
    }
    datosTuristicos = await respuesta.json();
    actualizarContadorBadge();
    filtrarDatos();
  } catch (error) {
    console.error('Error al cargar datos:', error);
    contador.textContent = 'Error al cargar los lugares.';
    contenedor.innerHTML = `
      <div class="col-span-full py-12 text-center text-rose-500">
        <p class="font-semibold">No se pudo cargar data/lugares.json</p>
        <p class="text-xs text-slate-500 mt-1">Asegúrate de ejecutar el proyecto desde un servidor local (Live Server).</p>
      </div>
    `;
  }
}

// Gestión de Favoritos
function alternarFavorito(id) {
  if (favoritos.includes(id)) {
    favoritos = favoritos.filter(favId => favId !== id);
  } else {
    favoritos.push(id);
  }
  localStorage.setItem('rutas_favoritos', JSON.stringify(favoritos));
  actualizarContadorBadge();
  filtrarDatos();
}

function actualizarContadorBadge() {
  if (contadorFavoritosBadge) {
    contadorFavoritosBadge.textContent = favoritos.length;
  }
}

// Marcadores del mapa
function actualizarMapa(lugares) {
  markersLayer.clearLayers();
  lugares.forEach(lugar => {
    const esFav = favoritos.includes(lugar.id);
    const marker = L.marker([lugar.coordenadas.lat, lugar.coordenadas.lng]);
    marker.bindPopup(`
      <div class="p-1 max-w-[200px]">
        <img src="${lugar.imagen}" alt="${lugar.nombre}" class="w-full h-24 object-cover rounded-md mb-2 bg-slate-100" onerror="this.style.display='none'">
        <div class="flex items-center justify-between gap-1 mb-1">
          <h3 class="font-bold text-sm text-slate-900 leading-tight">${lugar.nombre}</h3>
          ${esFav ? '<span class="text-rose-500 text-xs">❤️</span>' : ''}
        </div>
        <p class="text-xs text-slate-600 mb-2">${lugar.ciudad} &bull; ${lugar.añoConstruccion}</p>
        <a href="${lugar.googleMapsUrl}" target="_blank" class="inline-block text-xs font-semibold text-sky-600 hover:text-sky-800">
          ¿Cómo llegar? &rarr;
        </a>
      </div>
    `);
    markersLayer.addLayer(marker);
  });
}

// Renderizar tarjetas con botón de Favorito
function renderizarTarjetas(lugares) {
  contenedor.innerHTML = '';
  contador.textContent = `Mostrando ${lugares.length} ${lugares.length === 1 ? 'lugar' : 'lugares'}`;

  if (lugares.length === 0) {
    const mensajeVacio = soloFavoritosActivo
      ? 'Aún no tienes lugares guardados en favoritos. Haz clic en el corazón de cualquier lugar para guardarlo.'
      : 'Prueba ajustando los filtros de búsqueda.';

    contenedor.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-500">
        <i data-lucide="${soloFavoritosActivo ? 'heart-off' : 'map-pin-off'}" class="w-10 h-10 mx-auto mb-3 text-slate-400"></i>
        <p class="text-base font-semibold">${soloFavoritosActivo ? 'Sin favoritos guardados' : 'No se encontraron resultados'}</p>
        <p class="text-sm">${mensajeVacio}</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  lugares.forEach(lugar => {
    const esFavorito = favoritos.includes(lugar.id);
    const tarjeta = document.createElement('article');
    tarjeta.className = "bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition duration-200";

    const badgeCostoColor = lugar.esGratis 
      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
      : "bg-amber-50 text-amber-700 border-amber-200";

    const badgeCiudadColor = coloresCiudad[lugar.ciudad] || "bg-slate-50 text-slate-700 border-slate-200";

    tarjeta.innerHTML = `
      <div>
        <!-- Imagen y acciones -->
        <div class="relative w-full h-48 bg-slate-100 overflow-hidden group">
          <img src="${lugar.imagen}" alt="${lugar.nombre}" loading="lazy" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
               onerror="this.src='https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=60'">
          
          <div class="absolute top-3 left-3 flex gap-1.5">
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full border bg-white/95 shadow-sm ${badgeCiudadColor}">
              ${lugar.ciudad}
            </span>
          </div>

          <!-- Botón de Corazón (Favorito) -->
          <button onclick="alternarFavorito('${lugar.id}')" 
                  aria-label="Guardar en favoritos"
                  class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center text-slate-400 hover:text-rose-500 hover:scale-110 transition duration-150">
            <i data-lucide="heart" class="w-4 h-4 ${esFavorito ? 'text-rose-500 fill-rose-500' : ''}"></i>
          </button>
        </div>

        <div class="p-6">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full border ${badgeCostoColor}">
              ${lugar.precio.includes('Gratis') ? 'Gratis' : 'De Pago'}
            </span>
            <span class="text-xs text-slate-400 font-medium">Construcción: <strong>${lugar.añoConstruccion}</strong></span>
          </div>

          <h3 class="text-lg font-bold text-slate-900 mb-1 leading-snug">${lugar.nombre}</h3>
          <p class="text-xs font-medium text-slate-500 mb-3">${lugar.categoria}</p>
          
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

// Filtrado de lugares
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

    const coincideFavorito = soloFavoritosActivo ? favoritos.includes(lugar.id) : true;

    return coincideTexto && coincideCiudad && coincideCosto && coincideFavorito;
  });

  renderizarTarjetas(resultados);
  actualizarMapa(resultados);
}

// Toggle para el botón "Ver Favoritos"
btnFiltroFavoritos.addEventListener('click', () => {
  soloFavoritosActivo = !soloFavoritosActivo;

  if (soloFavoritosActivo) {
    btnFiltroFavoritos.classList.add('bg-rose-50', 'border-rose-300', 'text-rose-700');
    btnFiltroFavoritos.querySelector('span').textContent = 'Mostrando Favoritos';
  } else {
    btnFiltroFavoritos.classList.remove('bg-rose-50', 'border-rose-300', 'text-rose-700');
    btnFiltroFavoritos.querySelector('span').textContent = 'Ver Favoritos';
  }

  filtrarDatos();
});

// Botón de Compartir Web
if (btnCompartir) {
  btnCompartir.addEventListener('click', async () => {
    const shareData = {
      title: 'Ruta Patrimonial — Región de Valparaíso',
      text: 'Descubre los lugares turísticos e históricos más importantes de la Región de Valparaíso.',
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Compartir cancelado');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('¡Enlace copiado al portapapeles!');
    }
  });
}

// Listeners de los filtros
buscarInput.addEventListener('input', filtrarDatos);
filtroCiudad.addEventListener('change', filtrarDatos);
filtroCosto.addEventListener('change', filtrarDatos);

// Carga Inicial
document.addEventListener('DOMContentLoaded', cargarLugares);