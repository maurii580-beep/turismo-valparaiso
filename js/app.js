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
const contenedorMapa = document.getElementById('contenedorMapa');
let mapaAbierto = false;

// ==========================================
// 1. MODO OSCURO / CLARO
// ==========================================
const btnModoOscuro = document.getElementById('btnModoOscuro');
const iconoTema = document.getElementById('iconoTema') || document.getElementById('iconoModo');
const btnCompartir = document.getElementById('btnCompartir');
const btnSugerir = document.getElementById('btnSugerir') || document.getElementById('btnAbrirModalSugerencia');
const modalSugerencia = document.getElementById('modalSugerencia');
const modalSugerir = document.getElementById('modalSugerir');
const modalSugerirContenido = document.getElementById('modalSugerirContenido');

// Modal Elements
const modalDetalle = document.getElementById('modalDetalle');
const modalContenido = document.getElementById('modalContenido');
const btnCerrarModalSugerencia = document.getElementById('btnCerrarModalSugerencia');
const btnCerrarModalSugerir = document.getElementById('btnCerrarModalSugerir');
const btnCerrarModalDetalle = document.getElementById('btnCerrarModalDetalle');

// ==========================================
// FORMULA HAVERSINE (DISTANCIA EN KM)
// ==========================================
function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1); // Retorna ej: "1.4"
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
    // Si ya estaba activo, se desactiva
    ubicacionUsuario = null;
    textoCercaDeMi.textContent = "📍 Lugares Cerca de Mí";
    btnCercaDeMi.classList.remove('bg-sky-600', 'text-white');
    filtrarDatos();
    return;
  }

  if (!navigator.geolocation) {
    alert("Tu navegador no soporta geolocalización.");
    return;
  }

  textoCercaDeMi.textContent = "Buscando satélites...";

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      ubicacionUsuario = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };
      textoCercaDeMi.textContent = "📍 Más Cercanos Activo";
      btnCercaDeMi.classList.add('bg-sky-600', 'text-white');

      // Centrar mapa en la posición del usuario
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
      textoCercaDeMi.textContent = "📍 Lugares Cerca de Mí";
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

const historiasCiudades = {
  'Viña del Mar': {
    titulo: 'Viña del Mar',
    icono: '🌊',
    fundacion: '1878',
    nombreConocido: 'Ciudad Jardín'
  },
  'Valparaíso': {
    titulo: 'Valparaíso',
    icono: '🎨',
    fundacion: '1536',
    nombreConocido: 'Ciudad Puerto'
  },
  'Casablanca': {
    titulo: 'Casablanca',
    icono: '🍇',
    fundacion: '1753',
    nombreConocido: 'Valle del Vino'
  },
  'Concón': {
    titulo: 'Concón',
    icono: '🏖️',
    fundacion: '1544',
    nombreConocido: 'Capital Gastronómica'
  },
  'Quilpué': {
    titulo: 'Quilpué',
    icono: '☀️',
    fundacion: '1891',
    nombreConocido: 'Ciudad del Sol'
  },
  'Olmué': {
    titulo: 'Olmué',
    icono: '🌄',
    fundacion: '1854',
    nombreConocido: 'Capital Folclórica'
  }
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

  tarjetaCiudadHistoria.classList.remove('hidden', 'city-card-animate');
  tarjetaCiudadHistoria.getBoundingClientRect();

  tarjetaCiudadHistoria.innerHTML = `
    <div class="city-card-animate flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div class="flex items-start gap-3">
        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 text-2xl shadow-lg shadow-rose-500/25 ring-2 ring-white/40">
          ${infoCiudad.icono}
        </div>
        <div>
          <h3 class="text-xl font-black text-slate-900 dark:text-slate-100">${infoCiudad.titulo}</h3>
        </div>
      </div>
      <span class="inline-flex items-center gap-2 rounded-full bg-white/60 text-rose-700 dark:bg-slate-800/70 dark:text-rose-300 px-3 py-1 text-xs font-semibold shadow-sm ring-1 ring-white/50 dark:ring-slate-700/70 backdrop-blur-md">
        <i data-lucide="map-pin" class="w-3.5 h-3.5"></i>
        Región de Valparaíso
      </span>
    </div>
    <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
      <span><strong class="font-bold text-slate-800 dark:text-slate-100">Fundada:</strong> ${infoCiudad.fundacion}</span>
      <span><strong class="font-bold text-slate-800 dark:text-slate-100">Conocida como:</strong> ${infoCiudad.nombreConocido}</span>
    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// ==========================================
// FILTRADO Y ORDENAMIENTO
// ==========================================
function filtrarDatos() {
  const texto = (buscarInput?.value || '').toLowerCase();
  const ciudadSeleccionada = filtroCiudad?.value || 'todas';
  const categoriaSeleccionada = filtroCategoria?.value || 'todas';
  const costoSeleccionado = filtroCosto?.value || 'todos';
  cantidadTarjetasVisibles = 6;

  actualizarResumenFiltros(texto, ciudadSeleccionada, categoriaSeleccionada, costoSeleccionado);

  let resultados = datosTuristicos.filter(lugar => {
    const coincideTexto = lugar.nombre.toLowerCase().includes(texto) ||
                          lugar.descripcionHistorica.toLowerCase().includes(texto) ||
                          lugar.categoria.toLowerCase().includes(texto);

    const coincideCiudad = ciudadSeleccionada === 'todas' || lugar.ciudad === ciudadSeleccionada;

    let coincideCategoria = true;
    if (categoriaSeleccionada === 'ascensores') {
      coincideCategoria = lugar.categoria === 'Ascensor Patrimonial';
    } else if (categoriaSeleccionada === 'patrimonio') {
      coincideCategoria = lugar.categoria.toLowerCase().includes('museo') || 
                          lugar.categoria.toLowerCase().includes('patrimonio') ||
                          lugar.categoria.toLowerCase().includes('palacio') ||
                          lugar.categoria.toLowerCase().includes('arquitectura') ||
                          lugar.categoria.toLowerCase().includes('cívico');
    } else if (categoriaSeleccionada === 'naturaleza') {
      coincideCategoria = lugar.categoria.toLowerCase().includes('parque') || 
                          lugar.categoria.toLowerCase().includes('santuario') ||
                          lugar.categoria.toLowerCase().includes('humedal') ||
                          lugar.categoria.toLowerCase().includes('botánico');
    } else if (categoriaSeleccionada === 'playa') {
      coincideCategoria = lugar.categoria.toLowerCase().includes('playa') ||
                          lugar.categoria.toLowerCase().includes('balneario') ||
                          lugar.categoria.toLowerCase().includes('coster') ||
                          lugar.categoria.toLowerCase().includes('surf') ||
                          lugar.categoria.toLowerCase().includes('marina');
    } else if (categoriaSeleccionada === 'urbano') {
      coincideCategoria = lugar.categoria.toLowerCase().includes('arte') || 
                          lugar.categoria.toLowerCase().includes('mirador') ||
                          lugar.categoria.toLowerCase().includes('paseo') ||
                          lugar.categoria.toLowerCase().includes('escalera');
    }

    let coincideCosto = true;
    if (costoSeleccionado === 'gratis') coincideCosto = lugar.esGratis;
    if (costoSeleccionado === 'pago') coincideCosto = !lugar.esGratis;

    const coincideFavorito = soloFavoritosActivo ? favoritos.includes(lugar.id) : true;

    return coincideTexto && coincideCiudad && coincideCategoria && coincideCosto && coincideFavorito;
  });

  // Si la ubicación está activa, calculamos la distancia y ordenamos
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
  if (categoria !== 'todas') preferencias.push(filtroCategoria.options[filtroCategoria.selectedIndex].textContent.trim());
  if (costo !== 'todos') preferencias.push(costo === 'gratis' ? 'Solo gratis' : 'De pago');
  if (soloFavoritosActivo) preferencias.push('Solo favoritos');
  if (ubicacionUsuario) preferencias.push('Más cercanos');

  resumenFiltros.textContent = preferencias.length
    ? `Preferencias: ${preferencias.join(' · ')}`
    : 'Sin filtros activos';
}

// ==========================================
// RENDERIZADO DINÁMICO (3 VISTAS)
// ==========================================
function crearBloqueCurioso(lugar) {
  return lugar.datoCurioso ? `
    <div class="mb-4 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/50 flex items-start gap-2 text-xs">
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
    if (['no', 'false', 'no disponible', 'no habilitado'].includes(valor)) return 'No';
    return valor || 'No';
  })();

  return `
    <div class="order-2 flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
      <i data-lucide="car-front" class="w-3.5 h-3.5 text-sky-500"></i>
      <span class="truncate">Estac.: ${estacionamiento}</span>
    </div>
    <div class="order-4 flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
      <i data-lucide="accessibility" class="w-3.5 h-3.5 text-violet-500"></i>
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
    <article class="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
      <div class="relative h-48 w-full overflow-hidden cursor-pointer" onclick="abrirModalDetalle('${lugar.id}')">
        <img src="${imgSrc}" onerror="this.onerror=null;this.src='${imgFallback}';" alt="${lugar.nombre}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
        <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-60"></div>

        <button onclick="event.stopPropagation(); toggleFavorito('${lugar.id}')" 
                class="absolute top-3 right-3 p-2 rounded-full ${esFav ? 'bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/25' : 'bg-slate-900/40 hover:bg-slate-900/70'} backdrop-blur-sm transition-all duration-200 active:scale-90">
          <i data-lucide="heart" class="w-4 h-4 ${esFav ? 'text-white fill-white' : 'text-white'}"></i>
        </button>

        <div class="absolute bottom-3 left-3 flex flex-wrap gap-1.5 items-center">
          <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-900/70 text-white backdrop-blur-sm">${lugar.ciudad}</span>
          ${distanciaTag}
        </div>
      </div>

      <div class="p-5 flex-1 flex flex-col">
        <div class="flex justify-between items-start gap-2 mb-1">
          <h3 class="font-bold text-base text-slate-800 dark:text-slate-100 hover:text-sky-500 cursor-pointer" onclick="abrirModalDetalle('${lugar.id}')">${lugar.nombre}</h3>
          <span class="text-xs font-semibold text-slate-400 dark:text-slate-500 flex-shrink-0">${lugar.añoConstruccion}</span>
        </div>
        <p class="text-xs text-sky-600 dark:text-sky-400 font-medium mb-3">${lugar.categoria}</p>
        <p class="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 mb-4 flex-1">${lugar.descripcionHistorica}</p>

        ${bloqueCurioso}

        <div class="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-4 text-xs text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700/50">
          <div class="order-1 flex items-center gap-2">
            <i data-lucide="clock" class="w-3.5 h-3.5 flex-shrink-0 text-slate-400"></i>
            <span class="truncate">${lugar.horario}</span>
          </div>
          <div class="order-3 flex items-center gap-2">
            <i data-lucide="ticket" class="w-3.5 h-3.5 flex-shrink-0 text-slate-400"></i>
            <span class="truncate font-medium">${lugar.precio}</span>
          </div>
          ${crearInfoAccesibilidad(lugar)}
        </div>

        <div class="grid grid-cols-2 gap-2 mt-auto">
          <button onclick="abrirModalDetalle('${lugar.id}')" 
                  class="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5">
            <i data-lucide="maximize-2" class="w-3.5 h-3.5"></i> Detalles
          </button>
          <a href="${lugar.googleMapsUrl}" target="_blank" rel="noopener noreferrer" 
             class="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5">
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
    <article class="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-sky-500 transition-all flex items-center gap-4">
      <img src="${imgSrc}" onerror="this.onerror=null;this.src='${imgFallback}';" alt="${lugar.nombre}" loading="lazy" class="w-20 h-20 sm:w-28 sm:h-28 rounded-lg object-cover flex-shrink-0 cursor-pointer" onclick="abrirModalDetalle('${lugar.id}')">

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1 flex-wrap">
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">${lugar.ciudad}</span>
          ${distanciaTag}
          <span class="text-xs text-sky-600 dark:text-sky-400 font-medium truncate">${lugar.categoria}</span>
        </div>
        <h3 class="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate cursor-pointer hover:text-sky-500" onclick="abrirModalDetalle('${lugar.id}')">${lugar.nombre}</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">${lugar.horario} • <strong class="text-slate-700 dark:text-slate-300">${lugar.precio}</strong></p>
      </div>

      <div class="flex items-center gap-2 flex-shrink-0">
        <button onclick="toggleFavorito('${lugar.id}')" class="p-2 rounded-lg ${esFav ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-md shadow-rose-500/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'} transition-all duration-200">
          <i data-lucide="heart" class="w-4 h-4 ${esFav ? 'text-white fill-white' : 'text-slate-400'}"></i>
        </button>
        <button onclick="abrirModalDetalle('${lugar.id}')" class="p-2 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 hover:bg-sky-100">
          <i data-lucide="chevron-right" class="w-4 h-4"></i>
        </button>
      </div>
    </article>
  `;
}

function crearTarjetaIconos(lugar, esFav, imgFallback, imgSrc) {
  const distanciaTag = crearEtiquetaDistancia(lugar);

  return `
    <article class="group relative h-64 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all" onclick="abrirModalDetalle('${lugar.id}')">
      <img src="${imgSrc}" onerror="this.onerror=null;this.src='${imgFallback}';" alt="${lugar.nombre}" loading="lazy" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
      <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent"></div>

      <button onclick="event.stopPropagation(); toggleFavorito('${lugar.id}')" class="absolute top-3 right-3 p-2 rounded-full ${esFav ? 'bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/25' : 'bg-slate-900/60'} backdrop-blur-sm transition-all duration-200">
        <i data-lucide="heart" class="w-4 h-4 ${esFav ? 'text-white fill-white' : 'text-white'}"></i>
      </button>

      <div class="absolute bottom-3 left-3 right-3 text-white">
        <div class="flex items-center gap-1.5 mb-1">
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
    contenedorTarjetas.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
  } else if (tipoVistaActual === 'lista') {
    contenedorTarjetas.className = "grid grid-cols-1 gap-3";
  } else if (tipoVistaActual === 'iconos') {
    contenedorTarjetas.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4";
  }

  if (lugares.length === 0) {
    contenedorTarjetas.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-500 dark:text-slate-400">
        <i data-lucide="compass" class="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600"></i>
        <p class="text-base font-semibold">No se encontraron atractivos que coincidan con la búsqueda.</p>
      </div>`;
    lucide.createIcons();
    return;
  }

  contenedorTarjetas.innerHTML = tarjetasVisibles.map(lugar => {
    const esFav = favoritos.includes(lugar.id);
    const imgFallback = `https://placehold.co/600x400/f8fafc/64748b?text=${encodeURIComponent(lugar.nombre)}`;
    const imgSrc = lugar.imagen || imgFallback;

    if (tipoVistaActual === 'lista') {
      return crearTarjetaLista(lugar, esFav, imgFallback, imgSrc);
    }

    if (tipoVistaActual === 'iconos') {
      return crearTarjetaIconos(lugar, esFav, imgFallback, imgSrc);
    }

    return crearTarjetaGrid(lugar, esFav, imgFallback, imgSrc);
  }).join('');

  if (lugares.length > cantidadTarjetasVisibles) {
    contenedorTarjetas.insertAdjacentHTML('beforeend', `
      <div class="col-span-full flex justify-center pt-2">
        <button id="btnVerMas" type="button" onclick="mostrarMasTarjetas()"
                class="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs font-bold rounded-lg shadow-sm hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors">
          <i data-lucide="chevrons-down" class="w-4 h-4"></i>
          Ver más
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

  document.getElementById('modalImg').src = lugar.imagen;
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
    const acceso = String(lugar.accesoSillaRuedas ?? 'No').trim().toLowerCase();
    const accesoTexto = ['si', 'sí', 'yes', 'true', 'disponible', 'habilitado'].includes(acceso) ? 'Sí' : 'No';
    modalAccesoSilla.textContent = `Acceso silla de ruedas: ${accesoTexto}`;
  }

  const contReq = document.getElementById('modalRequisitoCont');
  const txtReq = document.getElementById('modalRequisito');
  if (lugar.requisitoIngreso) {
    contReq.classList.remove('hidden');
    txtReq.textContent = `Requisito: ${lugar.requisitoIngreso}`;
  } else {
    contReq.classList.add('hidden');
  }

  const infoAd = document.getElementById('modalInfoAdicional');
  if (lugar.infoAdicional) {
    infoAd.classList.remove('hidden');
    infoAd.textContent = lugar.infoAdicional;
  } else {
    infoAd.classList.add('hidden');
  }

  const linkWeb = document.getElementById('modalLinkWeb');
  if (lugar.sitioWeb) {
    linkWeb.classList.remove('hidden');
    linkWeb.href = lugar.sitioWeb;
  } else {
    linkWeb.classList.add('hidden');
  }

  const contCurioso = document.getElementById('modalDatoCurioso');
  const txtCurioso = document.getElementById('modalDatoCuriosoTexto');

  if (lugar.datoCurioso) {
    contCurioso?.classList.remove('hidden');
    if (txtCurioso) txtCurioso.textContent = lugar.datoCurioso;
  } else {
    contCurioso?.classList.add('hidden');
  }

  // Animación de entrada
  modalDetalle.classList.remove('hidden');
  setTimeout(() => {
    modalDetalle.classList.remove('opacity-0');
    modalContenido.classList.remove('scale-95');
    modalContenido.classList.add('scale-100');
  }, 10);

  lucide.createIcons();
}

function cerrarModalDetalle() {
  if (!modalDetalle) return;
  modalDetalle.classList.add('opacity-0');
  modalContenido.classList.remove('scale-100');
  modalContenido.classList.add('scale-95');
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
    attribution: '© OpenStreetMap contributors'
  }).addTo(mapaLeaflet);

  capaMarcadores = L.layerGroup().addTo(mapaLeaflet);
}

function actualizarMapa(lugares) {
  if (!capaMarcadores) return;
  capaMarcadores.clearLayers();

  lugares.forEach(lugar => {
    const marker = L.marker([lugar.coordenadas.lat, lugar.coordenadas.lng]);
    marker.bindPopup(`
      <div class="text-slate-900 font-sans p-1">
        <strong class="text-sm block">${lugar.nombre}</strong>
        <span class="text-xs text-sky-600 block mb-1">${lugar.ciudad} • ${lugar.categoria}</span>
        <button onclick="abrirModalDetalle('${lugar.id}')" class="text-xs font-bold text-sky-600 hover:underline">Ver información completa →</button>
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
    seccionMapa?.classList.add('ring-1', 'ring-sky-200', 'dark:ring-sky-900');
    btnToggleMapa.setAttribute('aria-expanded', 'true');
    btnToggleMapa.innerHTML = '<i data-lucide="chevrons-up" class="w-4 h-4"></i><span>Ocultar mapa</span>';
    if (mapaLeaflet) {
      setTimeout(() => mapaLeaflet.invalidateSize(), 220);
    }
  } else {
    contenedorMapa.classList.remove('max-h-[1200px]', 'opacity-100');
    contenedorMapa.classList.add('max-h-0', 'opacity-0');
    seccionMapa?.classList.remove('ring-1', 'ring-sky-200', 'dark:ring-sky-900');
    btnToggleMapa.setAttribute('aria-expanded', 'false');
    btnToggleMapa.innerHTML = '<i data-lucide="chevrons-down" class="w-4 h-4"></i><span>Mostrar mapa</span>';
  }

  if (window.lucide) lucide.createIcons();
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
  const botonTema = document.getElementById('btnModoOscuro');
  if (botonTema) {
    botonTema.setAttribute('aria-pressed', String(esOscuro));
    botonTema.classList.toggle('theme-toggle--active', esOscuro);
  }

  if (!iconoTema) return;
  iconoTema.dataset.lucide = esOscuro ? 'moon' : 'sun';
  const textoModo = document.getElementById('textoModo');
  if (textoModo) {
    textoModo.textContent = esOscuro ? 'Oscuro' : 'Claro';
  }
  if (window.lucide) lucide.createIcons();
}

// ==========================================
// 2. BOTÓN COMPARTIR (Web Share API o Portapapeles)
// ==========================================
async function compartirGuia() {
  const totalFavs = favoritos.length;
  const texto = totalFavs > 0 
    ? `¡Mira mi lista de ${totalFavs} lugares favoritos guardados en la Guía Turística de la Región de Valparaíso!` 
    : '¡Descubre los mejores atractivos turísticos y ascensores patrimoniales de la Región de Valparaíso!';
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
    alert('📋 ¡Enlace copiado al portapapeles para compartir!');
  }
}

// ==========================================
// 3. BOTÓN SUGERIR LUGAR
// ==========================================
function sugerirLugar() {
  if (modalSugerir) {
    modalSugerir.classList.remove('hidden');
    setTimeout(() => {
      modalSugerir.classList.remove('opacity-0');
      modalSugerirContenido?.classList.remove('scale-95');
      modalSugerirContenido?.classList.add('scale-100');
    }, 10);
    return;
  }

  if (modalSugerencia) {
    modalSugerencia.classList.remove('hidden');
    return;
  }

  const mensaje = encodeURIComponent('¡Hola! Me gustaría sugerir un nuevo atractivo turístico para la Guía de Valparaíso: \n\n- Nombre del lugar:\n- Comuna:\n- ¿Por qué debería estar en la guía?:');
  const mailtoUrl = `mailto:contacto@turismovalparaiso.cl?subject=Sugerencia%20Nuevo%20Lugar%20Turistico&body=${mensaje}`;
  window.open(mailtoUrl, '_blank');
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
// CONTROL DEL FORMULARIO DE CONTACTO (FORMSPREE)
// ==========================================
const formContacto = document.getElementById('formContacto');
const btnEnviarForm = document.getElementById('btnEnviarForm');
const estadoEnvioForm = document.getElementById('estadoEnvioForm');

const formContactoModal = document.getElementById('formContactoModal');
const btnEnviarFormModal = document.getElementById('btnEnviarFormModal');
const estadoEnvioFormModal = document.getElementById('estadoEnvioFormModal');

const formSugerencia = document.getElementById('formSugerencia');
const btnEnviarSugerencia = document.getElementById('btnEnviarSugerencia');
const estadoEnvio = document.getElementById('estadoEnvio');

if (formContacto) {
  formContacto.addEventListener('submit', async (e) => {
    e.preventDefault();

    btnEnviarForm.disabled = true;
    btnEnviarForm.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Enviando...`;
    lucide.createIcons();

    const formData = new FormData(formContacto);

    try {
      const response = await fetch(formContacto.action, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        formContacto.reset();
        mostrarEstadoForm('¡Mensaje enviado con éxito! Gracias por contactarnos.', 'exito');
      } else {
        const data = await response.json();
        if (data.errors) {
          mostrarEstadoForm(data.errors.map(err => err.message).join(', '), 'error');
        } else {
          mostrarEstadoForm('No se pudo enviar el mensaje. Revisa el formulario o intenta nuevamente.', 'error');
        }
      }
    } catch (error) {
      console.error('Error al enviar formulario:', error);
      mostrarEstadoForm('No se pudo establecer conexión. Revisa tu conexión a internet.', 'error');
    } finally {
      btnEnviarForm.disabled = false;
      btnEnviarForm.innerHTML = `<i data-lucide="send" class="w-4 h-4"></i><span>Enviar Mensaje</span>`;
      lucide.createIcons();
    }
  });
}

if (formContactoModal) {
  formContactoModal.addEventListener('submit', async (e) => {
    e.preventDefault();

    btnEnviarFormModal.disabled = true;
    btnEnviarFormModal.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Enviando...`;
    lucide.createIcons();

    const formData = new FormData(formContactoModal);

    try {
      const response = await fetch(formContactoModal.action, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        formContactoModal.reset();
        mostrarEstadoFormModal('¡Sugerencia enviada con éxito! Muchas gracias por tu aporte.', 'exito');
        setTimeout(() => cerrarModalSugerir(), 1200);
      } else {
        const data = await response.json();
        if (data.errors) {
          mostrarEstadoFormModal(data.errors.map(err => err.message).join(', '), 'error');
        } else {
          mostrarEstadoFormModal('No se pudo enviar la sugerencia. Inténtalo nuevamente en unos segundos.', 'error');
        }
      }
    } catch (error) {
      console.error('Error al enviar sugerencia:', error);
      mostrarEstadoFormModal('No se pudo establecer conexión. Revisa tu conexión a internet.', 'error');
    } finally {
      btnEnviarFormModal.disabled = false;
      btnEnviarFormModal.innerHTML = `<i data-lucide="send" class="w-4 h-4"></i><span>Enviar Sugerencia</span>`;
      lucide.createIcons();
    }
  });
}

if (formSugerencia) {
  formSugerencia.addEventListener('submit', async (e) => {
    e.preventDefault();

    btnEnviarSugerencia.disabled = true;
    btnEnviarSugerencia.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Enviando...`;
    lucide.createIcons();

    const formData = new FormData(formSugerencia);

    try {
      const response = await fetch(formSugerencia.action, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        formSugerencia.reset();
        mostrarEstadoSugerencia('¡Sugerencia enviada con éxito! Muchas gracias por tu aporte.', 'exito');
      } else {
        const data = await response.json();
        if (data.errors) {
          mostrarEstadoSugerencia(data.errors.map(err => err.message).join(', '), 'error');
        } else {
          mostrarEstadoSugerencia('No se pudo enviar la sugerencia. Inténtalo nuevamente en unos segundos.', 'error');
        }
      }
    } catch (error) {
      console.error('Error al enviar sugerencia:', error);
      mostrarEstadoSugerencia('No se pudo establecer conexión. Revisa tu conexión a internet.', 'error');
    } finally {
      btnEnviarSugerencia.disabled = false;
      btnEnviarSugerencia.innerHTML = `<i data-lucide="send" class="w-4 h-4"></i><span>Enviar sugerencia</span>`;
      lucide.createIcons();
    }
  });
}

function mostrarEstadoForm(mensaje, tipo) {
  if (!estadoEnvioForm) return;
  estadoEnvioForm.classList.remove('hidden', 'bg-emerald-100', 'text-emerald-800', 'dark:bg-emerald-950', 'dark:text-emerald-300', 'bg-rose-100', 'text-rose-800', 'dark:bg-rose-950', 'dark:text-rose-300', 'border', 'border-emerald-200', 'dark:border-emerald-900', 'border-rose-200', 'dark:border-rose-900');

  if (tipo === 'exito') {
    estadoEnvioForm.classList.add('bg-emerald-100', 'text-emerald-800', 'border', 'border-emerald-200', 'dark:bg-emerald-950', 'dark:text-emerald-300', 'dark:border-emerald-900');
  } else {
    estadoEnvioForm.classList.add('bg-rose-100', 'text-rose-800', 'border', 'border-rose-200', 'dark:bg-rose-950', 'dark:text-rose-300', 'dark:border-rose-900');
  }

  estadoEnvioForm.textContent = mensaje;
}

function mostrarEstadoSugerencia(mensaje, tipo) {
  if (!estadoEnvio) return;
  estadoEnvio.classList.remove('hidden', 'text-emerald-600', 'dark:text-emerald-400', 'text-rose-600', 'dark:text-rose-400', 'font-semibold');

  if (tipo === 'exito') {
    estadoEnvio.classList.add('text-emerald-600', 'dark:text-emerald-400', 'font-semibold');
  } else {
    estadoEnvio.classList.add('text-rose-600', 'dark:text-rose-400', 'font-semibold');
  }

  estadoEnvio.textContent = mensaje;
}

function mostrarEstadoFormModal(mensaje, tipo) {
  if (!estadoEnvioFormModal) return;
  estadoEnvioFormModal.classList.remove('hidden', 'bg-emerald-100', 'text-emerald-800', 'dark:bg-emerald-950', 'dark:text-emerald-300', 'bg-rose-100', 'text-rose-800', 'dark:bg-rose-950', 'dark:text-rose-300', 'border', 'border-emerald-200', 'dark:border-emerald-900', 'border-rose-200', 'dark:border-rose-900');

  if (tipo === 'exito') {
    estadoEnvioFormModal.classList.add('bg-emerald-100', 'text-emerald-800', 'border', 'border-emerald-200', 'dark:bg-emerald-950', 'dark:text-emerald-300', 'dark:border-emerald-900');
  } else {
    estadoEnvioFormModal.classList.add('bg-rose-100', 'text-rose-800', 'border', 'border-rose-200', 'dark:bg-rose-950', 'dark:text-rose-300', 'dark:border-rose-900');
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
  actualizarTarjetaCiudad();

  btnFiltroFavoritos?.addEventListener('click', () => {
    soloFavoritosActivo = !soloFavoritosActivo;
    btnFiltroFavoritos.classList.toggle('is-active', soloFavoritosActivo);
    btnFiltroFavoritos.classList.toggle('border-rose-500', soloFavoritosActivo);
    btnFiltroFavoritos.classList.toggle('bg-rose-50', soloFavoritosActivo);
    filtrarDatos();
  });

  btnCercaDeMi?.addEventListener('click', alternarGeolocalizacion);
  btnToggleMapa?.addEventListener('click', alternarMapa);
  btnModoOscuro?.addEventListener('click', toggleTema);
  btnCompartir?.addEventListener('click', compartirGuia);
  btnSugerir?.addEventListener('click', sugerirLugar);

  btnCerrarModalSugerencia?.addEventListener('click', () => {
    modalSugerencia?.classList.add('hidden');
  });
  btnCerrarModalSugerir?.addEventListener('click', cerrarModalSugerir);
  if (modalSugerencia) {
    window.addEventListener('click', (e) => {
      if (e.target === modalSugerencia) modalSugerencia.classList.add('hidden');
    });
  }
  if (modalSugerir) {
    window.addEventListener('click', (e) => {
      if (e.target === modalSugerir) cerrarModalSugerir();
    });
  }

  // Botones de cambio de vista
  btnVistaGrid?.addEventListener('click', () => setVista('grid'));
  btnVistaLista?.addEventListener('click', () => setVista('lista'));
  btnVistaIconos?.addEventListener('click', () => setVista('iconos'));

  // Cierre de modal
  btnCerrarModalDetalle?.addEventListener('click', cerrarModalDetalle);
  modalDetalle?.addEventListener('click', (e) => {
    if (e.target === modalDetalle) cerrarModalDetalle();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cerrarModalDetalle();
      cerrarModalSugerir();
      modalSugerencia?.classList.add('hidden');
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
    if (b.tipo === tipo) {
      b.btn.classList.add('bg-white', 'dark:bg-slate-700', 'text-slate-900', 'dark:text-slate-100', 'shadow-sm');
      b.btn.classList.remove('text-slate-600', 'dark:text-slate-400');
    } else {
      b.btn.classList.remove('bg-white', 'dark:bg-slate-700', 'text-slate-900', 'dark:text-slate-100', 'shadow-sm');
      b.btn.classList.add('text-slate-600', 'dark:text-slate-400');
    }
  });

  filtrarDatos();
}