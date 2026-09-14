// ==========================================
// ESTADO GLOBAL DE LA APLICACIÓN
// ==========================================
let datosTuristicos = [];
let favoritos = JSON.parse(localStorage.getItem('favoritos_valpo')) || [];
let soloFavoritosActivo = false;
let tipoVistaActual = 'grid'; // 'grid' | 'lista' | 'iconos'
let ubicacionUsuario = null; // { lat, lng }
let mapaLeaflet = null;
let capaMarcadores = null;
let cantidadTarjetasVisibles = 6;
let resultadosFiltradosActuales = [];

// ==========================================
// REFERENCIAS DEL DOM
// ==========================================
const contenedorTarjetas = document.getElementById('contenedorTarjetas');
const buscarInput = document.getElementById('buscarInput');
const filtroCiudad = document.getElementById('filtroCiudad');
const filtroCategoria = document.getElementById('filtroCategoria');
const filtroCosto = document.getElementById('filtroCosto');
const btnFiltroFavoritos = document.getElementById('btnFiltroFavoritos');
const contadorFavoritosBadge = document.getElementById('contadorFavoritosBadge');
const resumenFiltros = document.getElementById('resumenFiltros');
const tarjetaCiudadHistoria = document.getElementById('tarjetaCiudadHistoria');
const btnCercaDeMi = document.getElementById('btnCercaDeMi');
const textoCercaDeMi = document.getElementById('textoCercaDeMi');

const btnVistaGrid = document.getElementById('btnVistaGrid');
const btnVistaLista = document.getElementById('btnVistaLista');
const btnVistaIconos = document.getElementById('btnVistaIconos');
const btnToggleMapa = document.getElementById('btnToggleMapa');
const textoToggleMapa = document.getElementById('textoToggleMapa');
const contenedorMapa = document.getElementById('contenedorMapa');
let mapaAbierto = false;

const lugaresInstagrameables = [
  'reloj-de-flores',
  'castillo-wulff',
  'paseo-gervasoni',
  'escalera-de-colores-galvez',
  'puerta-roja-pasaje-galvez',
  'la-sebastiana',
  'campo-dunar-concon'
];

// Controles Superiores y Modales
const btnModoOscuro = document.getElementById('btnModoOscuro');
const iconoModo = document.getElementById('iconoModo');
const btnCompartir = document.getElementById('btnCompartir');
const btnSugerir = document.getElementById('btnAbrirModalSugerencia');

const modalSugerir = document.getElementById('modalSugerir');
const modalSugerirContenido = document.getElementById('modalSugerirContenido');
const btnCerrarModalSugerir = document.getElementById('btnCerrarModalSugerir');

const modalDetalle = document.getElementById('modalDetalle');
const modalContenido = document.getElementById('modalContenido');
const btnCerrarModalDetalle = document.getElementById('btnCerrarModalDetalle');

// ==========================================
// UTILIDADES: NORMALIZACIÓN Y DISTANCIA
// ==========================================
function normalizarTexto(txt) {
  return (txt || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}

// ==========================================
// INICIALIZACIÓN Y CARGA DE DATOS
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  inicializarTema();
  inicializarMapa();
  await cargarDatos();
  actualizarContadorFavoritos();
  configurarEventos();
});

async function cargarDatos() {
  try {
    const res = await fetch('data/lugares.json');
    datosTuristicos = await res.json();
    filtrarDatos();
  } catch (error) {
    console.error('Error cargando data/lugares.json:', error);
    contenedorTarjetas.innerHTML = `
      <div class="col-span-full p-8 text-center bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300">
        <p class="font-bold">Error al cargar los atractivos turísticos.</p>
      </div>`;
  }
}

// ==========================================
// SISTEMA DE GEOLOCALIZACIÓN
// ==========================================
function alternarGeolocalizacion() {
  if (ubicacionUsuario) {
    ubicacionUsuario = null;
    textoCercaDeMi.textContent = "Cerca de Mí";
    btnCercaDeMi.classList.remove('bg-sky-600', 'text-white');
    btnCercaDeMi.classList.add('bg-sky-50', 'dark:bg-sky-950/60', 'text-sky-700', 'dark:text-sky-300');
    filtrarDatos();
    return;
  }

  if (!navigator.geolocation) {
    alert("Tu navegador no soporta geolocalización.");
    return;
  }

  btnCercaDeMi.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 text-sky-500 animate-spin"></i><span>Localizando...</span>`;
  lucide.createIcons();

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      ubicacionUsuario = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };
      
      btnCercaDeMi.innerHTML = `<i data-lucide="navigation" class="w-3.5 h-3.5 text-white"></i><span id="textoCercaDeMi">Más Cercanos Activo</span>`;
      btnCercaDeMi.classList.remove('bg-sky-50', 'dark:bg-sky-950/60', 'text-sky-700', 'dark:text-sky-300');
      btnCercaDeMi.classList.add('bg-sky-600', 'text-white');
      lucide.createIcons();

      if (mapaLeaflet) {
        mapaLeaflet.setView([ubicacionUsuario.lat, ubicacionUsuario.lng], 14);
        L.marker([ubicacionUsuario.lat, ubicacionUsuario.lng])
          .addTo(mapaLeaflet)
          .bindPopup("<b>📍 Tu ubicación actual</b>")
          .openPopup();
      }

      filtrarDatos();
    },
    (err) => {
      console.warn(err);
      alert("No se pudo obtener tu ubicación. Verifica que los permisos GPS estén habilitados.");
      btnCercaDeMi.innerHTML = `<i data-lucide="navigation" class="w-3.5 h-3.5 text-sky-500"></i><span id="textoCercaDeMi">Cerca de Mí</span>`;
      lucide.createIcons();
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

const historiasCiudades = {
  'Viña del Mar': { titulo: 'Viña del Mar', icono: '🌊', fundacion: '1878', nombreConocido: 'Ciudad Jardín' },
  'Valparaíso': { titulo: 'Valparaíso', icono: '🎨', fundacion: '1536', nombreConocido: 'Ciudad Puerto' },
  'Casablanca': { titulo: 'Casablanca', icono: '🍇', fundacion: '1753', nombreConocido: 'Valle del Vino' },
  'Concón': { titulo: 'Concón', icono: '🏖️', fundacion: '1544', nombreConocido: 'Capital Gastronómica' },
  'Quilpué': { titulo: 'Quilpué', icono: '☀️', fundacion: '1891', nombreConocido: 'Ciudad del Sol' },
  'Olmué': { titulo: 'Olmué', icono: '🌄', fundacion: '1854', nombreConocido: 'Capital Folclórica' }
};

function actualizarTarjetaCiudad() {
  if (!tarjetaCiudadHistoria) return;
  const ciudadSeleccionada = filtroCiudad?.value || 'todas';

  if (!ciudadSeleccionada || ciudadSeleccionada === 'todas') {
    tarjetaCiudadHistoria.classList.add('hidden');
    tarjetaCiudadHistoria.innerHTML = '';
    return;
  }

  const infoCiudad = historiasCiudades[ciudadSeleccionada];
  if (!infoCiudad) {
    tarjetaCiudadHistoria.classList.add('hidden');
    tarjetaCiudadHistoria.innerHTML = '';
    return;
  }

  tarjetaCiudadHistoria.classList.remove('hidden');
  tarjetaCiudadHistoria.innerHTML = `
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div class="flex items-center gap-3">
        <span class="text-2xl p-2 bg-white/80 dark:bg-slate-800 rounded-xl shadow-sm ring-1 ring-black/5">${infoCiudad.icono}</span>
        <div>
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">${infoCiudad.titulo}</h3>
          <p class="text-[11px] text-slate-500 dark:text-slate-400">${infoCiudad.nombreConocido} &bull; Fundada en ${infoCiudad.fundacion}</p>
        </div>
      </div>
      <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 self-start sm:self-center">
        Región de Valparaíso
      </span>
    </div>
  `;
}

// ==========================================
// FILTRADO Y ORDENAMIENTO
// ==========================================
function filtrarDatos() {
  const texto = normalizarTexto(buscarInput?.value);
  const ciudadSeleccionada = filtroCiudad?.value || 'todas';
  const categoriaSeleccionada = filtroCategoria?.value || 'todas';
  const costoSeleccionado = filtroCosto?.value || 'todos';
  cantidadTarjetasVisibles = 6;

  actualizarResumenFiltros(buscarInput?.value || '', ciudadSeleccionada, categoriaSeleccionada, costoSeleccionado);

  let resultados = datosTuristicos.filter(lugar => {
    const nombreNorm = normalizarTexto(lugar.nombre);
    const descNorm = normalizarTexto(lugar.descripcionHistorica);
    const catNorm = normalizarTexto(lugar.categoria);
    const datoCuriosoNorm = normalizarTexto(lugar.datoCurioso);

    const coincideTexto = !texto || 
      nombreNorm.includes(texto) || 
      descNorm.includes(texto) || 
      catNorm.includes(texto) ||
      datoCuriosoNorm.includes(texto);

    const coincideCiudad = ciudadSeleccionada === 'todas' || lugar.ciudad === ciudadSeleccionada;

    let coincideCategoria = true;
    if (categoriaSeleccionada === 'ascensores') {
      coincideCategoria = lugar.categoria.toLowerCase().includes('ascensor');
    } else if (categoriaSeleccionada === 'estaciones') {
      coincideCategoria = catNorm.includes('transporte') || catNorm.includes('efe') || catNorm.includes('ferroviario');
    } else if (categoriaSeleccionada === 'patrimonio') {
      coincideCategoria = catNorm.includes('museo') || catNorm.includes('patrimonio') || catNorm.includes('palacio') || catNorm.includes('arquitectura') || catNorm.includes('cívico');
    } else if (categoriaSeleccionada === 'naturaleza') {
      coincideCategoria = catNorm.includes('parque') || catNorm.includes('santuario') || catNorm.includes('humedal') || catNorm.includes('botánico');
    } else if (categoriaSeleccionada === 'playa') {
      coincideCategoria = catNorm.includes('playa') || catNorm.includes('balneario') || catNorm.includes('coster') || catNorm.includes('surf');
    } else if (categoriaSeleccionada === 'urbano') {
      coincideCategoria = catNorm.includes('arte') || catNorm.includes('mirador') || catNorm.includes('paseo') || catNorm.includes('escalera');
    } else if (categoriaSeleccionada === 'instagrameable') {
      coincideCategoria = lugaresInstagrameables.includes(lugar.id);
    }

    let coincideCosto = true;
    if (costoSeleccionado === 'gratis') coincideCosto = lugar.esGratis;
    if (costoSeleccionado === 'pago') coincideCosto = !lugar.esGratis;

    const coincideFavorito = soloFavoritosActivo ? favoritos.includes(lugar.id) : true;

    return coincideTexto && coincideCiudad && coincideCategoria && coincideCosto && coincideFavorito;
  });

  if (ubicacionUsuario) {
    resultados = resultados.map(l => {
      const dist = calcularDistanciaKm(
        ubicacionUsuario.lat,
        ubicacionUsuario.lng,
        l.coordenadas.lat,
        l.coordenadas.lng
      );
      return { ...l, distanciaKm: Number.parseFloat(dist) };
    }).sort((a, b) => a.distanciaKm - b.distanciaKm);
  }

  resultadosFiltradosActuales = resultados;
  renderizarTarjetas(resultadosFiltradosActuales);
  actualizarMapa(resultados);
  actualizarTarjetaCiudad();
}

function actualizarResumenFiltros(texto, ciudad, categoria, costo) {
  if (!resumenFiltros) return;
  const preferencias = [];
  if (texto.trim()) preferencias.push(`"${texto.trim()}"`);
  if (ciudad !== 'todas') preferencias.push(ciudad);
  if (categoria !== 'todas' && filtroCategoria) preferencias.push(filtroCategoria.options[filtroCategoria.selectedIndex].textContent.trim());
  if (costo !== 'todos') preferencias.push(costo === 'gratis' ? 'Solo gratis' : 'De pago');
  if (soloFavoritosActivo) preferencias.push('Solo favoritos');
  if (ubicacionUsuario) preferencias.push('Más cercanos');

  resumenFiltros.textContent = preferencias.length
    ? `Filtros: ${preferencias.join(' · ')}`
    : 'Sin filtros activos';
}

// ==========================================
// RENDERIZADO DINÁMICO (3 VISTAS)
// ==========================================
function crearBloqueCurioso(lugar) {
  return lugar.datoCurioso ? `
    <div class="mb-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/50 flex items-start gap-2 text-xs">
      <span class="text-amber-500 text-sm leading-none mt-0.5">💡</span>
      <p class="text-amber-900 dark:text-amber-200 font-medium leading-snug">
        <strong class="font-bold">¿Sabías que?</strong> ${lugar.datoCurioso}
      </p>
    </div>
  ` : '';
}

function crearInfoAccesibilidad(lugar) {
  const estacionamiento = lugar.estacionamiento || 'No disponible';
  const accesoTexto = (() => {
    const valor = String(lugar.accesoSillaRuedas ?? 'No').trim().toLowerCase();
    if (['si', 'sí', 'yes', 'true', 'disponible', 'habilitado'].includes(valor)) return 'Sí';
    if (valor.startsWith('parcial')) return 'Parcial';
    return 'No';
  })();

  return `
    <div class="order-2 flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 truncate">
      <i data-lucide="car-front" class="w-3.5 h-3.5 text-sky-500 flex-shrink-0"></i>
      <span class="truncate">Estac.: ${estacionamiento}</span>
    </div>
    <div class="order-4 flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
      <i data-lucide="accessibility" class="w-3.5 h-3.5 text-violet-500 flex-shrink-0"></i>
      <span>Silla: ${accesoTexto}</span>
    </div>
  `;
}

function crearEtiquetaDistancia(lugar) {
  return lugar.distanciaKm !== undefined ? `
    <span class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-500 text-white shadow-sm">
      <i data-lucide="map-pin" class="w-3 h-3"></i> ${lugar.distanciaKm} km
    </span>` : '';
}

function crearTarjetaGrid(lugar, esFav, imgFallback, imgSrc) {
  const distanciaTag = crearEtiquetaDistancia(lugar);
  const bloqueCurioso = crearBloqueCurioso(lugar);

  return `
    <article class="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all flex flex-col">
      <div class="relative h-48 w-full overflow-hidden cursor-pointer" onclick="abrirModalDetalle('${lugar.id}')">
        <img src="${imgSrc}" onerror="this.onerror=null;this.src='${imgFallback}';" alt="${lugar.nombre}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>

        <button onclick="event.stopPropagation(); toggleFavorito('${lugar.id}')" 
                class="absolute top-2.5 right-2.5 p-2 rounded-full ${esFav ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-900/50 hover:bg-slate-900/80 text-white'} backdrop-blur-sm transition-all active:scale-90"
                aria-label="Guardar favorito">
          <i data-lucide="heart" class="w-4 h-4 ${esFav ? 'fill-white' : ''}"></i>
        </button>

        <div class="absolute bottom-2.5 left-2.5 flex flex-wrap gap-1.5 items-center">
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur-sm">${lugar.ciudad}</span>
          ${distanciaTag}
        </div>
      </div>

      <div class="p-4 sm:p-5 flex-1 flex flex-col">
        <div class="flex justify-between items-start gap-2 mb-1">
          <h3 class="font-bold text-base text-slate-800 dark:text-slate-100 hover:text-sky-500 cursor-pointer transition-colors" onclick="abrirModalDetalle('${lugar.id}')">${lugar.nombre}</h3>
          <span class="text-xs font-semibold text-slate-400 dark:text-slate-500 flex-shrink-0">${lugar.añoConstruccion}</span>
        </div>
        <p class="text-xs text-sky-600 dark:text-sky-400 font-medium mb-2.5">${lugar.categoria}</p>
        <p class="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-3 flex-1">${lugar.descripcionHistorica}</p>

        ${bloqueCurioso}

        <div class="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-3 text-xs text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700/50">
          <div class="order-1 flex items-center gap-1.5">
            <i data-lucide="clock" class="w-3.5 h-3.5 flex-shrink-0 text-slate-400"></i>
            <span class="truncate">${lugar.horario}</span>
          </div>
          <div class="order-3 flex items-center gap-1.5">
            <i data-lucide="ticket" class="w-3.5 h-3.5 flex-shrink-0 text-slate-400"></i>
            <span class="truncate font-medium">${lugar.precio}</span>
          </div>
          ${crearInfoAccesibilidad(lugar)}
        </div>

        <div class="grid grid-cols-2 gap-2 mt-auto">
          <button onclick="abrirModalDetalle('${lugar.id}')" 
                  class="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5">
            <i data-lucide="maximize-2" class="w-3.5 h-3.5"></i> Detalles
          </button>
          <a href="${lugar.googleMapsUrl}" target="_blank" rel="noopener noreferrer" 
             class="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5">
            <i data-lucide="navigation" class="w-3.5 h-3.5"></i> Llegar
          </a>
        </div>
      </div>
    </article>
  `;
}

function crearTarjetaLista(lugar, esFav, imgFallback, imgSrc) {
  const distanciaTag = crearEtiquetaDistancia(lugar);

  return `
    <article class="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-sky-500 transition-all flex items-center gap-3">
      <img src="${imgSrc}" onerror="this.onerror=null;this.src='${imgFallback}';" alt="${lugar.nombre}" loading="lazy" class="w-20 h-20 rounded-lg object-cover flex-shrink-0 cursor-pointer" onclick="abrirModalDetalle('${lugar.id}')">

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5 mb-1 flex-wrap">
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">${lugar.ciudad}</span>
          ${distanciaTag}
        </div>
        <h3 class="font-bold text-sm text-slate-900 dark:text-white truncate cursor-pointer hover:text-sky-500" onclick="abrirModalDetalle('${lugar.id}')">${lugar.nombre}</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">${lugar.horario} &bull; <strong class="text-slate-700 dark:text-slate-300">${lugar.precio}</strong></p>
      </div>

      <div class="flex items-center gap-1 flex-shrink-0">
        <button onclick="toggleFavorito('${lugar.id}')" class="p-2 rounded-lg ${esFav ? 'text-rose-500' : 'text-slate-400 hover:text-slate-600'} transition-colors">
          <i data-lucide="heart" class="w-4 h-4 ${esFav ? 'fill-rose-500' : ''}"></i>
        </button>
        <button onclick="abrirModalDetalle('${lugar.id}')" class="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
          <i data-lucide="chevron-right" class="w-4 h-4"></i>
        </button>
      </div>
    </article>
  `;
}

function crearTarjetaIconos(lugar, esFav, imgFallback, imgSrc) {
  const distanciaTag = crearEtiquetaDistancia(lugar);

  return `
    <article class="group relative h-60 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all" onclick="abrirModalDetalle('${lugar.id}')">
      <img src="${imgSrc}" onerror="this.onerror=null;this.src='${imgFallback}';" alt="${lugar.nombre}" loading="lazy" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
      <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent"></div>

      <button onclick="event.stopPropagation(); toggleFavorito('${lugar.id}')" class="absolute top-2.5 right-2.5 p-2 rounded-full ${esFav ? 'bg-rose-500 text-white' : 'bg-slate-900/60 text-white'} backdrop-blur-sm transition-colors">
        <i data-lucide="heart" class="w-4 h-4 ${esFav ? 'fill-white' : ''}"></i>
      </button>

      <div class="absolute bottom-3 left-3 right-3 text-white">
        <div class="flex items-center gap-1 mb-1">
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md">${lugar.ciudad}</span>
          ${distanciaTag}
        </div>
        <h3 class="font-bold text-sm leading-tight group-hover:text-sky-300 transition-colors">${lugar.nombre}</h3>
        <p class="text-[11px] text-slate-300 font-light truncate mt-0.5">${lugar.categoria}</p>
      </div>
    </article>
  `;
}

function renderizarTarjetas(lugares) {
  if (!contenedorTarjetas) return;
  const tarjetasVisibles = lugares.slice(0, cantidadTarjetasVisibles);

  if (tipoVistaActual === 'grid') {
    contenedorTarjetas.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5";
  } else if (tipoVistaActual === 'lista') {
    contenedorTarjetas.className = "grid grid-cols-1 gap-2.5";
  } else if (tipoVistaActual === 'iconos') {
    contenedorTarjetas.className = "grid grid-cols-2 lg:grid-cols-4 gap-3";
  }

  if (lugares.length === 0) {
    contenedorTarjetas.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">
        <i data-lucide="compass" class="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600"></i>
        <p class="text-sm font-semibold">No se encontraron atractivos para este filtro.</p>
      </div>`;
    lucide.createIcons();
    return;
  }

  contenedorTarjetas.innerHTML = tarjetasVisibles.map(lugar => {
    const esFav = favoritos.includes(lugar.id);
    const imgFallback = `https://placehold.co/600x400/0f172a/94a3b8?text=${encodeURIComponent(lugar.nombre)}`;
    const imgSrc = lugar.imagen || imgFallback;

    if (tipoVistaActual === 'lista') return crearTarjetaLista(lugar, esFav, imgFallback, imgSrc);
    if (tipoVistaActual === 'iconos') return crearTarjetaIconos(lugar, esFav, imgFallback, imgSrc);
    return crearTarjetaGrid(lugar, esFav, imgFallback, imgSrc);
  }).join('');

  if (lugares.length > cantidadTarjetasVisibles) {
    contenedorTarjetas.insertAdjacentHTML('beforeend', `
      <div class="col-span-full flex justify-center pt-2">
        <button id="btnVerMas" type="button" onclick="mostrarMasTarjetas()"
                class="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs font-bold rounded-xl shadow-sm hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors">
          <i data-lucide="chevrons-down" class="w-4 h-4"></i>
          Ver más lugares (${lugares.length - cantidadTarjetasVisibles} restantes)
        </button>
      </div>
    `);
  }

  lucide.createIcons();
}

function mostrarMasTarjetas() {
  cantidadTarjetasVisibles += 6;
  renderizarTarjetas(resultadosFiltradosActuales);
}

// ==========================================
// CONTROL DEL MODAL DE DETALLE
// ==========================================
function abrirModalDetalle(id) {
  const lugar = datosTuristicos.find(l => l.id === id);
  if (!lugar || !modalDetalle) return;

  const imgFallback = `https://placehold.co/600x400/0f172a/94a3b8?text=${encodeURIComponent(lugar.nombre)}`;
  const modalImg = document.getElementById('modalImg');
  
  modalImg.src = lugar.imagen || imgFallback;
  modalImg.onerror = () => { modalImg.src = imgFallback; };

  document.getElementById('modalTitulo').textContent = lugar.nombre;
  document.getElementById('modalAño').textContent = `Año ${lugar.añoConstruccion}`;
  document.getElementById('modalCategoria').textContent = `${lugar.ciudad} • ${lugar.categoria}`;
  document.getElementById('modalDescripcion').textContent = lugar.descripcionHistorica;
  document.getElementById('modalHorario').textContent = lugar.horario;
  document.getElementById('modalPrecio').textContent = lugar.precio;
  document.getElementById('modalLinkMaps').href = lugar.googleMapsUrl;

  const modalEstacionamiento = document.getElementById('modalEstacionamiento');
  const modalAccesoSilla = document.getElementById('modalAccesoSilla');
  if (modalEstacionamiento) {
    modalEstacionamiento.textContent = `Estacionamiento: ${lugar.estacionamiento || 'No disponible'}`;
  }
  if (modalAccesoSilla) {
    modalAccesoSilla.textContent = `Acceso silla: ${lugar.accesoSillaRuedas || 'No especificado'}`;
  }

  const contReq = document.getElementById('modalRequisitoCont');
  const txtReq = document.getElementById('modalRequisito');
  if (lugar.requisitoIngreso) {
    contReq?.classList.remove('hidden');
    if (txtReq) txtReq.textContent = `Requisito: ${lugar.requisitoIngreso}`;
  } else {
    contReq?.classList.add('hidden');
  }

  const infoAd = document.getElementById('modalInfoAdicional');
  if (lugar.infoAdicional) {
    infoAd?.classList.remove('hidden');
    if (infoAd) infoAd.textContent = lugar.infoAdicional;
  } else {
    infoAd?.classList.add('hidden');
  }

  const linkWeb = document.getElementById('modalLinkWeb');
  if (lugar.sitioWeb) {
    linkWeb?.classList.remove('hidden');
    if (linkWeb) linkWeb.href = lugar.sitioWeb;
  } else {
    linkWeb?.classList.add('hidden');
  }

  const contCurioso = document.getElementById('modalDatoCurioso');
  const txtCurioso = document.getElementById('modalDatoCuriosoTexto');
  if (lugar.datoCurioso) {
    contCurioso?.classList.remove('hidden');
    if (txtCurioso) txtCurioso.textContent = lugar.datoCurioso;
  } else {
    contCurioso?.classList.add('hidden');
  }

  modalDetalle.classList.remove('hidden');
  setTimeout(() => {
    modalDetalle.classList.remove('opacity-0');
    modalContenido?.classList.remove('scale-95');
    modalContenido?.classList.add('scale-100');
  }, 10);

  lucide.createIcons();
}

function cerrarModalDetalle() {
  if (!modalDetalle) return;
  modalDetalle.classList.add('opacity-0');
  modalContenido?.classList.remove('scale-100');
  modalContenido?.classList.add('scale-95');
  setTimeout(() => {
    modalDetalle.classList.add('hidden');
  }, 200);
}

// ==========================================
// MAPA LEAFLET
// ==========================================
function inicializarMapa() {
  const mapElem = document.getElementById('mapa');
  if (!mapElem) return;
  mapaLeaflet = L.map('mapa').setView([-33.03, -71.55], 11);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(mapaLeaflet);

  capaMarcadores = L.layerGroup().addTo(mapaLeaflet);
}

function actualizarMapa(lugares) {
  if (!capaMarcadores) return;
  capaMarcadores.clearLayers();

  lugares.forEach(lugar => {
    const marker = L.marker([lugar.coordenadas.lat, lugar.coordenadas.lng]);
    marker.bindPopup(`
      <div class="p-1">
        <strong class="text-sm block text-slate-900">${lugar.nombre}</strong>
        <span class="text-xs text-sky-600 block mb-1">${lugar.ciudad} • ${lugar.categoria}</span>
        <button onclick="abrirModalDetalle('${lugar.id}')" class="text-xs font-bold text-sky-600 hover:underline">Ver ficha completa →</button>
      </div>
    `);
    capaMarcadores.addLayer(marker);
  });
}

function alternarMapa() {
  if (!contenedorMapa || !btnToggleMapa) return;
  mapaAbierto = !mapaAbierto;
  const seccionMapa = document.getElementById('seccionMapa');

  if (mapaAbierto) {
    contenedorMapa.classList.remove('max-h-0', 'opacity-0');
    contenedorMapa.classList.add('max-h-[1200px]', 'opacity-100');
    seccionMapa?.classList.add('ring-1', 'ring-sky-300', 'dark:ring-sky-800');
    btnToggleMapa.setAttribute('aria-expanded', 'true');
    btnToggleMapa.innerHTML = '<i data-lucide="chevrons-up" class="w-3.5 h-3.5"></i><span>Ocultar</span>';
    if (mapaLeaflet) {
      setTimeout(() => mapaLeaflet.invalidateSize(), 220);
    }
  } else {
    contenedorMapa.classList.remove('max-h-[1200px]', 'opacity-100');
    contenedorMapa.classList.add('max-h-0', 'opacity-0');
    seccionMapa?.classList.remove('ring-1', 'ring-sky-300', 'dark:ring-sky-800');
    btnToggleMapa.setAttribute('aria-expanded', 'false');
    btnToggleMapa.innerHTML = '<i data-lucide="map" class="w-3.5 h-3.5"></i><span>Ver mapa</span>';
  }

  lucide.createIcons();
}

// ==========================================
// FAVORITOS Y TEMA
// ==========================================
function toggleFavorito(id) {
  if (favoritos.includes(id)) {
    favoritos = favoritos.filter(fId => fId !== id);
  } else {
    favoritos.push(id);
  }
  localStorage.setItem('favoritos_valpo', JSON.stringify(favoritos));
  actualizarContadorFavoritos();
  filtrarDatos();
}

function actualizarContadorFavoritos() {
  if (contadorFavoritosBadge) {
    contadorFavoritosBadge.textContent = favoritos.length;
  }
}

function inicializarTema() {
  const esOscuro = localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', esOscuro);
  actualizarIconoTema(esOscuro);
}

function toggleTema() {
  const esOscuro = document.documentElement.classList.toggle('dark');
  localStorage.theme = esOscuro ? 'dark' : 'light';
  actualizarIconoTema(esOscuro);
}

function actualizarIconoTema(esOscuro) {
  if (btnModoOscuro) {
    btnModoOscuro.setAttribute('aria-pressed', String(esOscuro));
  }
  
  const iconoModoActual = document.getElementById('iconoModo');
  if (iconoModoActual) {
    // Asignar el icono correspondiente al estado actual
    iconoModoActual.dataset.lucide = esOscuro ? 'moon' : 'sun';
    
    // Cambiar dinámicamente los colores (Luna celeste, Sol amarillo)
    if (esOscuro) {
      iconoModoActual.className = "w-3.5 h-3.5 text-sky-300";
    } else {
      iconoModoActual.className = "w-3.5 h-3.5 text-amber-500";
    }
  }
  
  const textoModo = document.getElementById('textoModo');
  if (textoModo) {
    textoModo.textContent = esOscuro ? 'Oscuro' : 'Claro';
  }
  
  lucide.createIcons();
}

// ==========================================
// BOTÓN COMPARTIR
// ==========================================
async function compartirGuia() {
  const totalFavs = favoritos.length;
  const texto = totalFavs > 0 
    ? `¡Mira mi lista con ${totalFavs} lugares favoritos en la Guía Patrimonial de Valparaíso!` 
    : '¡Descubre los mejores atractivos históricos y miradores de la Región de Valparaíso!';
  const url = window.location.href;

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Guía Turística Región de Valparaíso',
        text: texto,
        url: url
      });
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Error al compartir:', err);
    }
  } else {
    navigator.clipboard.writeText(url);
    alert('📋 Enlace copiado al portapapeles.');
  }
}

// ==========================================
// CONTROL MODAL SUGERIR / CONTACTO (ÚNICO)
// ==========================================
function abrirModalSugerir() {
  if (!modalSugerir) return;
  modalSugerir.classList.remove('hidden');
  setTimeout(() => {
    modalSugerir.classList.remove('opacity-0');
    modalSugerirContenido?.classList.remove('scale-95');
    modalSugerirContenido?.classList.add('scale-100');
  }, 10);
  lucide.createIcons();
}

function cerrarModalSugerir() {
  if (!modalSugerir) return;
  modalSugerir.classList.add('opacity-0');
  modalSugerirContenido?.classList.remove('scale-100');
  modalSugerirContenido?.classList.add('scale-95');
  setTimeout(() => {
    modalSugerir.classList.add('hidden');
  }, 200);
}

// ==========================================
// FORMULARIO FORMSPREE CONSOLIDADO
// ==========================================
const formContactoModal = document.getElementById('formContactoModal');
const btnEnviarFormModal = document.getElementById('btnEnviarFormModal');
const estadoEnvioFormModal = document.getElementById('estadoEnvioFormModal');

if (formContactoModal) {
  formContactoModal.addEventListener('submit', async (e) => {
    e.preventDefault();

    btnEnviarFormModal.disabled = true;
    btnEnviarFormModal.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Enviando...</span>`;
    lucide.createIcons();

    const formData = new FormData(formContactoModal);

    try {
      const response = await fetch(formContactoModal.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        formContactoModal.reset();
        mostrarEstadoForm('¡Sugerencia enviada con éxito! Gracias por colaborar.', 'exito');
        setTimeout(() => cerrarModalSugerir(), 1600);
      } else {
        const data = await response.json();
        const msg = data.errors ? data.errors.map(err => err.message).join(', ') : 'No se pudo enviar la sugerencia.';
        mostrarEstadoForm(msg, 'error');
      }
    } catch (error) {
      console.error('Error enviando formulario:', error);
      mostrarEstadoForm('Error de red. Revisa tu conexión a internet.', 'error');
    } finally {
      btnEnviarFormModal.disabled = false;
      btnEnviarFormModal.innerHTML = `<i data-lucide="send" class="w-4 h-4"></i><span>Enviar Sugerencia</span>`;
      lucide.createIcons();
    }
  });
}

function mostrarEstadoForm(mensaje, tipo) {
  if (!estadoEnvioFormModal) return;
  estadoEnvioFormModal.classList.remove('hidden', 'bg-emerald-50', 'text-emerald-800', 'border-emerald-200', 'bg-rose-50', 'text-rose-800', 'border-rose-200', 'border');

  if (tipo === 'exito') {
    estadoEnvioFormModal.classList.add('bg-emerald-50', 'text-emerald-800', 'border', 'border-emerald-200');
  } else {
    estadoEnvioFormModal.classList.add('bg-rose-50', 'text-rose-800', 'border', 'border-rose-200');
  }
  estadoEnvioFormModal.textContent = mensaje;
}

// ==========================================
// EVENT LISTENERS
// ==========================================
function configurarEventos() {
  buscarInput?.addEventListener('input', filtrarDatos);
  filtroCiudad?.addEventListener('change', filtrarDatos);
  filtroCategoria?.addEventListener('change', filtrarDatos);
  filtroCosto?.addEventListener('change', filtrarDatos);

  btnFiltroFavoritos?.addEventListener('click', () => {
    soloFavoritosActivo = !soloFavoritosActivo;
    btnFiltroFavoritos.classList.toggle('border-rose-500', soloFavoritosActivo);
    btnFiltroFavoritos.classList.toggle('bg-rose-50', soloFavoritosActivo);
    btnFiltroFavoritos.classList.toggle('dark:bg-rose-950/40', soloFavoritosActivo);
    filtrarDatos();
  });

  btnCercaDeMi?.addEventListener('click', alternarGeolocalizacion);
  btnToggleMapa?.addEventListener('click', alternarMapa);
  btnModoOscuro?.addEventListener('click', toggleTema);
  btnCompartir?.addEventListener('click', compartirGuia);
  btnSugerir?.addEventListener('click', abrirModalSugerir);
  btnCerrarModalSugerir?.addEventListener('click', cerrarModalSugerir);

  btnVistaGrid?.addEventListener('click', () => setVista('grid'));
  btnVistaLista?.addEventListener('click', () => setVista('lista'));
  btnVistaIconos?.addEventListener('click', () => setVista('iconos'));

  btnCerrarModalDetalle?.addEventListener('click', cerrarModalDetalle);

  window.addEventListener('click', (e) => {
    if (e.target === modalDetalle) cerrarModalDetalle();
    if (e.target === modalSugerir) cerrarModalSugerir();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cerrarModalDetalle();
      cerrarModalSugerir();
    }
  });
}

function setVista(tipo) {
  tipoVistaActual = tipo;
  const botones = [
    { btn: btnVistaGrid, tipo: 'grid' },
    { btn: btnVistaLista, tipo: 'lista' },
    { btn: btnVistaIconos, tipo: 'iconos' }
  ];

  botones.forEach(b => {
    if (b.btn) {
      if (b.tipo === tipo) {
        b.btn.classList.add('bg-white', 'dark:bg-slate-700', 'text-slate-900', 'dark:text-slate-100', 'shadow-sm');
        b.btn.classList.remove('text-slate-500', 'dark:text-slate-400');
      } else {
        b.btn.classList.remove('bg-white', 'dark:bg-slate-700', 'text-slate-900', 'dark:text-slate-100', 'shadow-sm');
        b.btn.classList.add('text-slate-500', 'dark:text-slate-400');
      }
    }
  });

  filtrarDatos();
}