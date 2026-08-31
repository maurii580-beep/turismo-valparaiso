let datosTuristicos = [];
let soloFavoritosActivo = false;

// Cargar favoritos desde localStorage
let favoritos = JSON.parse(localStorage.getItem('rutas_favoritos')) || [];

// Configuración de WhatsApp
const MI_NUMERO_WHATSAPP = "56995864161"; // <-- Reemplaza por tu número de WhatsApp

// Elementos del DOM
const contenedor = document.getElementById('contenedorTarjetas');
const contador = document.getElementById('contadorResultados');
const buscarInput = document.getElementById('buscarInput');
const filtroCiudad = document.getElementById('filtroCiudad');
const filtroCosto = document.getElementById('filtroCosto');
const btnFiltroFavoritos = document.getElementById('btnFiltroFavoritos');
const textoFiltroFavoritos = document.getElementById('textoFiltroFavoritos');
const contadorFavoritosBadge = document.getElementById('contadorFavoritosBadge');
const btnCompartir = document.getElementById('btnCompartir');
const btnModoOscuro = document.getElementById('btnModoOscuro');
const iconoModo = document.getElementById('iconoModo');
const textoModo = document.getElementById('textoModo');
const filtroCategoria = document.getElementById('filtroCategoria');

// Elementos del Modal
const modalSugerencia = document.getElementById('modalSugerencia');
const btnAbrirModalSugerencia = document.getElementById('btnAbrirModalSugerencia');
const btnCerrarModal = document.getElementById('btnCerrarModal');
const formSugerencia = document.getElementById('formSugerencia');
const btnEnviarSugerencia = document.getElementById('btnEnviarSugerencia');
const estadoEnvio = document.getElementById('estadoEnvio');

// Configuración de Formspree
const FORMSPREE_ID = "mvkogjqa"; // <-- Pega aquí tu ID de Formspree (ej: "xkgonwla")

// ==========================================
// MODO OSCURO (Dark Mode)
// ==========================================
function inicializarModoOscuro() {
  const temaGuardado = localStorage.getItem('tema');
  const prefiereOscuro = window.matchMedia?.('(prefers-color-scheme: dark)').matches;

  if (temaGuardado === 'dark' || (!temaGuardado && prefiereOscuro)) {
    document.documentElement.classList.add('dark');
    actualizarBotonTema(true);
  } else {
    document.documentElement.classList.remove('dark');
    actualizarBotonTema(false);
  }
}

function actualizarBotonTema(esOscuro) {
  if (iconoModo && textoModo) {
    if (esOscuro) {
      iconoModo.dataset.lucide = 'sun';
      textoModo.textContent = 'Claro';
    } else {
      iconoModo.dataset.lucide = 'moon';
      textoModo.textContent = 'Oscuro';
    }
    if (window.lucide) lucide.createIcons();
  }
}

if (btnModoOscuro) {
  btnModoOscuro.addEventListener('click', () => {
    const esOscuro = document.documentElement.classList.toggle('dark');
    localStorage.setItem('tema', esOscuro ? 'dark' : 'light');
    actualizarBotonTema(esOscuro);
  });
}

// ==========================================
// MODAL DE SUGERENCIAS Y ENVÍO A CORREO (FORMSPREE)
// ==========================================
if (btnAbrirModalSugerencia && modalSugerencia) {
  btnAbrirModalSugerencia.addEventListener('click', () => {
    modalSugerencia.classList.remove('hidden');
    if (estadoEnvio) estadoEnvio.classList.add('hidden');
    if (window.lucide) lucide.createIcons();
  });
}

if (btnCerrarModal && modalSugerencia) {
  btnCerrarModal.addEventListener('click', () => {
    modalSugerencia.classList.add('hidden');
  });
}

// Cerrar haciendo clic fuera del modal
window.addEventListener('click', (e) => {
  if (e.target === modalSugerencia) {
    modalSugerencia.classList.add('hidden');
  }
});

// Enviar formulario
if (formSugerencia) {
  formSugerencia.addEventListener('submit', async (e) => {
    e.preventDefault();

    btnEnviarSugerencia.disabled = true;
    btnEnviarSugerencia.innerHTML = `
      <span class="inline-block animate-spin mr-2">🔄</span> Enviando...
    `;

    const datosForm = new FormData(formSugerencia);

    try {
      const respuesta = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        body: datosForm,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (respuesta.ok) {
        estadoEnvio.textContent = "¡Muchas gracias! Tu sugerencia ha sido enviada con éxito.";
        estadoEnvio.className = "text-xs text-center py-1 text-emerald-600 dark:text-emerald-400 font-medium block";
        formSugerencia.reset();

        setTimeout(() => {
          modalSugerencia.classList.add('hidden');
          estadoEnvio.classList.add('hidden');
        }, 2200);
      } else {
        throw new Error('Error en el servidor');
      }
    } catch (error) {
      console.error('Error en envío de formulario:', error);
      estadoEnvio.textContent = "Hubo un problema al enviar. Inténtalo nuevamente.";
      estadoEnvio.className = "text-xs text-center py-1 text-rose-600 dark:text-rose-400 font-medium block";
    } finally {
      btnEnviarSugerencia.disabled = false;
      btnEnviarSugerencia.innerHTML = `
        <i data-lucide="send" class="w-4 h-4"></i>
        <span>Enviar sugerencia</span>
      `;
      if (window.lucide) lucide.createIcons();
    }
  });
}

// ==========================================
// LEAFLET MAPA
// ==========================================
let map;
let markersLayer;

if (window.L) {
  map = L.map('mapa').setView([-33.08, -71.42], 10);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
} else {
  console.warn('Leaflet no se cargó correctamente; se omite el mapa.');
}

const coloresCiudad = {
  "Viña del Mar": "bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
  "Valparaíso": "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  "Casablanca": "bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  "Concón": "bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800",
  "Quilpué": "bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  "Olmué": "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
};

// Carga asíncrona de datos
async function cargarLugares() {
  try {
    const respuesta = await fetch('data/lugares.json');
    if (!respuesta.ok) {
      throw new Error(`HTTP Error: ${respuesta.status}`);
    }
    datosTuristicos = await respuesta.json();
    actualizarContadorBadge();
    filtrarDatos();
  } catch (error) {
    console.error('Error al cargar datos:', error);
    if (contador) contador.textContent = 'Error al cargar los lugares.';
    if (contenedor) {
      contenedor.innerHTML = `
        <div class="col-span-full py-12 text-center text-rose-500">
          <p class="font-semibold">No se pudo cargar data/lugares.json</p>
          <p class="text-xs text-slate-500 mt-1">Asegúrate de estar ejecutando el proyecto en un servidor local o Vercel.</p>
        </div>
      `;
    }
  }
}

// Favoritos expuesto al window
window.alternarFavorito = function(id) {
  if (favoritos.includes(id)) {
    favoritos = favoritos.filter(favId => favId !== id);
  } else {
    favoritos.push(id);
  }
  localStorage.setItem('rutas_favoritos', JSON.stringify(favoritos));
  actualizarContadorBadge();
  filtrarDatos();
};

function actualizarContadorBadge() {
  if (contadorFavoritosBadge) {
    contadorFavoritosBadge.textContent = favoritos.length;
  }
}

function actualizarMapa(lugares) {
  if (!markersLayer) return;

  markersLayer.clearLayers();
  lugares.forEach(lugar => {
    const esFav = favoritos.includes(lugar.id);
    const marker = L.marker([lugar.coordenadas.lat, lugar.coordenadas.lng]);
    marker.bindPopup(`
      <div class="p-1 max-w-[200px]">
        <img src="${lugar.imagen}" alt="${lugar.nombre}" class="w-full h-24 object-cover rounded-md mb-2 bg-slate-100 dark:bg-slate-800" onerror="this.style.display='none'">
        <div class="flex items-center justify-between gap-1 mb-1">
          <h3 class="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight">${lugar.nombre}</h3>
          ${esFav ? '<span class="text-rose-500 text-xs">❤️</span>' : ''}
        </div>
        <p class="text-xs text-slate-600 dark:text-slate-400 mb-2">${lugar.ciudad} &bull; ${lugar.añoConstruccion}</p>
        <a href="${lugar.googleMapsUrl}" target="_blank" class="inline-block text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline">
          ¿Cómo llegar? &rarr;
        </a>
      </div>
    `);
    markersLayer.addLayer(marker);
  });
}

function renderizarTarjetas(lugares) {
  if (!contenedor) return;
  contenedor.innerHTML = '';
  if (contador) {
    contador.textContent = `Mostrando ${lugares.length} ${lugares.length === 1 ? 'lugar' : 'lugares'}`;
  }

  if (lugares.length === 0) {
    const mensajeVacio = soloFavoritosActivo
      ? 'Aún no tienes lugares guardados en favoritos. Haz clic en el corazón de cualquier lugar para guardarlo.'
      : 'Prueba ajustando los filtros de búsqueda.';

    contenedor.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">
        <i data-lucide="${soloFavoritosActivo ? 'heart-off' : 'map-pin-off'}" class="w-10 h-10 mx-auto mb-3 text-slate-400 dark:text-slate-600"></i>
        <p class="text-base font-semibold">${soloFavoritosActivo ? 'Sin favoritos guardados' : 'No se encontraron resultados'}</p>
        <p class="text-sm">${mensajeVacio}</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  lugares.forEach(lugar => {
    const esFavorito = favoritos.includes(lugar.id);
    const tarjeta = document.createElement('article');
    tarjeta.className = "bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between hover:shadow-md transition duration-200";

    const badgeCostoColor = lugar.esGratis 
      ? "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" 
      : "bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";

    const badgeCiudadColor = coloresCiudad[lugar.ciudad] || "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";

    tarjeta.innerHTML = `
      <div>
        <div class="relative w-full h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden group">
          <img src="${lugar.imagen}" alt="${lugar.nombre}" loading="lazy" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
               onerror="this.src='https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=60'">
          
          <div class="absolute top-3 left-3 flex gap-1.5">
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full border bg-white/95 dark:bg-slate-900/90 backdrop-blur-sm shadow-sm ${badgeCiudadColor}">
              ${lugar.ciudad}
            </span>
          </div>

          <button onclick="window.alternarFavorito('${lugar.id}')" 
                  aria-label="Guardar en favoritos"
                  class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow flex items-center justify-center text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:scale-110 transition duration-150">
            <i data-lucide="heart" class="w-4 h-4 ${esFavorito ? 'text-rose-500 fill-rose-500' : ''}"></i>
          </button>
        </div>

        <div class="p-6">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full border ${badgeCostoColor}">
              ${lugar.precio.includes('Gratis') ? 'Gratis' : 'De Pago'}
            </span>
            <span class="text-xs text-slate-400 dark:text-slate-500 font-medium">Construcción: <strong>${lugar.añoConstruccion}</strong></span>
          </div>

          <h3 class="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1 leading-snug">${lugar.nombre}</h3>
          <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">${lugar.categoria}</p>
          
          <p class="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">${lugar.descripcionHistorica}</p>

          <div class="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-col gap-1.5 mb-2">
            <div class="flex items-center gap-2">
              <i data-lucide="clock" class="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0"></i>
              <span>${lugar.horario}</span>
            </div>
            <div class="flex items-center gap-2">
              <i data-lucide="ticket" class="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0"></i>
              <span>${lugar.precio}</span>
            </div>
            
            ${lugar.requisitoIngreso ? `
              <div class="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium">
                <i data-lucide="id-card" class="w-3.5 h-3.5 flex-shrink-0"></i>
                <span>Requisito: ${lugar.requisitoIngreso}</span>
              </div>
            ` : ''}

            ${lugar.infoAdicional ? `
              <div class="flex items-start gap-2 text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 p-2 rounded-md mt-1 border border-sky-100 dark:border-sky-900/50">
                <i data-lucide="info" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5"></i>
                <span class="text-[11px] leading-snug">${lugar.infoAdicional}</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Pie de la tarjeta con botones de acción -->
      <div class="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 mt-auto flex flex-col sm:flex-row gap-2">
        <a href="${lugar.googleMapsUrl}" target="_blank" rel="noopener noreferrer" 
           class="flex-1 inline-flex justify-center items-center gap-1.5 px-3 py-2.5 bg-slate-900 dark:bg-sky-600 hover:bg-sky-700 dark:hover:bg-sky-500 text-white text-xs font-medium rounded-lg transition-colors duration-150">
          <i data-lucide="navigation" class="w-3.5 h-3.5"></i>
          <span>¿Cómo llegar?</span>
        </a>

        ${lugar.sitioWeb ? `
          <a href="${lugar.sitioWeb}" target="_blank" rel="noopener noreferrer" 
             class="inline-flex justify-center items-center gap-1.5 px-3 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg transition-colors duration-150"
             title="Visitar sitio web oficial">
            <i data-lucide="globe" class="w-3.5 h-3.5 text-sky-500"></i>
            <span>Web</span>
          </a>
        ` : ''}
      </div>
    `;
    contenedor.appendChild(tarjeta);
  });

  if (window.lucide) lucide.createIcons();
}

// Función de Filtrado Actualizada
function filtrarDatos() {
  const texto = (buscarInput?.value || '').toLowerCase();
  const ciudadSeleccionada = filtroCiudad?.value || 'todas';
  const categoriaSeleccionada = filtroCategoria?.value || 'todas';
  const costoSeleccionado = filtroCosto?.value || 'todos';

  const resultados = datosTuristicos.filter(lugar => {
    // 1. Filtro de búsqueda libre
    const coincideTexto = lugar.nombre.toLowerCase().includes(texto) ||
                          lugar.descripcionHistorica.toLowerCase().includes(texto) ||
                          lugar.categoria.toLowerCase().includes(texto);

    // 2. Filtro de Ciudad
    const coincideCiudad = ciudadSeleccionada === 'todas' || lugar.ciudad === ciudadSeleccionada;

    // 3. Filtro de Categoría Especial
    let coincideCategoria = true;
    if (categoriaSeleccionada === 'ascensores') {
      // Coincidencia exacta por categoría de ascensor operativo
      coincideCategoria = lugar.categoria === 'Ascensor Patrimonial';
    } else if (categoriaSeleccionada === 'patrimonio') {
      coincideCategoria = lugar.categoria.toLowerCase().includes('museo') || 
                          lugar.categoria.toLowerCase().includes('patrimonio') ||
                          lugar.categoria.toLowerCase().includes('palacio') ||
                          lugar.categoria.toLowerCase().includes('arquitectura') ||
                          lugar.categoria.toLowerCase().includes('monumento') ||
                          lugar.categoria.toLowerCase().includes('cívico');
    } else if (categoriaSeleccionada === 'naturaleza') {
      coincideCategoria = lugar.categoria.toLowerCase().includes('parque') || 
                          lugar.categoria.toLowerCase().includes('santuario') ||
                          lugar.categoria.toLowerCase().includes('humedal') ||
                          lugar.categoria.toLowerCase().includes('dunar') ||
                          lugar.categoria.toLowerCase().includes('playa') ||
                          lugar.categoria.toLowerCase().includes('reserva');
    } else if (categoriaSeleccionada === 'urbano') {
      coincideCategoria = lugar.categoria.toLowerCase().includes('arte') || 
                          lugar.categoria.toLowerCase().includes('mirador') ||
                          lugar.categoria.toLowerCase().includes('paseo') ||
                          lugar.categoria.toLowerCase().includes('escalera');
    }

    // 4. Filtro de Costo
    let coincideCosto = true;
    if (costoSeleccionado === 'gratis') coincideCosto = lugar.esGratis;
    if (costoSeleccionado === 'pago') coincideCosto = !lugar.esGratis;

    // 5. Filtro de Favoritos
    const coincideFavorito = soloFavoritosActivo ? favoritos.includes(lugar.id) : true;

    return coincideTexto && coincideCiudad && coincideCategoria && coincideCosto && coincideFavorito;
  });

  renderizarTarjetas(resultados);
  actualizarMapa(resultados);
}

if (btnFiltroFavoritos) {
  btnFiltroFavoritos.addEventListener('click', () => {
    soloFavoritosActivo = !soloFavoritosActivo;

    if (soloFavoritosActivo) {
      btnFiltroFavoritos.classList.add('bg-rose-50', 'dark:bg-rose-950/50', 'border-rose-300', 'dark:border-rose-800', 'text-rose-700', 'dark:text-rose-300');
      if (textoFiltroFavoritos) textoFiltroFavoritos.textContent = 'Mostrando Favoritos';
    } else {
      btnFiltroFavoritos.classList.remove('bg-rose-50', 'dark:bg-rose-950/50', 'border-rose-300', 'dark:border-rose-800', 'text-rose-700', 'dark:text-rose-300');
      if (textoFiltroFavoritos) textoFiltroFavoritos.textContent = 'Ver Favoritos';
    }

    filtrarDatos();
  });
}

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

if (buscarInput) buscarInput.addEventListener('input', filtrarDatos);
if (filtroCiudad) filtroCiudad.addEventListener('change', filtrarDatos);
if (filtroCategoria) filtroCategoria.addEventListener('change', filtrarDatos);
if (filtroCosto) filtroCosto.addEventListener('change', filtrarDatos);

// Inicio
document.addEventListener('DOMContentLoaded', () => {
  inicializarModoOscuro();
  cargarLugares();
});