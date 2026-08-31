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
const btnCercaDeMi = document.getElementById('btnCercaDeMi');
const textoCercaDeMi = document.getElementById('textoCercaDeMi');

const btnVistaGrid = document.getElementById('btnVistaGrid');
const btnVistaLista = document.getElementById('btnVistaLista');
const btnVistaIconos = document.getElementById('btnVistaIconos');

// Modal Elements
const modalDetalle = document.getElementById('modalDetalle');
const modalContenido = document.getElementById('modalContenido');
const btnCerrarModalSugerencia = document.getElementById('btnCerrarModalSugerencia');
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

// ==========================================
// FILTRADO Y ORDENAMIENTO
// ==========================================
function filtrarDatos() {
  const texto = (buscarInput?.value || '').toLowerCase();
  const ciudadSeleccionada = filtroCiudad?.value || 'todas';
  const categoriaSeleccionada = filtroCategoria?.value || 'todas';
  const costoSeleccionado = filtroCosto?.value || 'todos';

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
                          lugar.categoria.toLowerCase().includes('playa') ||
                          lugar.categoria.toLowerCase().includes('botánico');
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
      return { ...l, distanciaKm: parseFloat(dist) };
    }).sort((a, b) => a.distanciaKm - b.distanciaKm);
  }

  renderizarTarjetas(resultados);
  actualizarMapa(resultados);
}

// ==========================================
// RENDERIZADO DINÁMICO (3 VISTAS)
// ==========================================
function renderizarTarjetas(lugares) {
  if (!contenedorTarjetas) return;

  // Ajustar grid según el tipo de vista
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

  contenedorTarjetas.innerHTML = lugares.map(lugar => {
    const esFav = favoritos.includes(lugar.id);
    const distanciaTag = lugar.distanciaKm !== undefined ? `
      <span class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-500 text-white shadow-sm">
        <i data-lucide="map-pin" class="w-3 h-3"></i> ${lugar.distanciaKm} km
      </span>` : '';

    // VISTA 1: GRID CLÁSICA
    if (tipoVistaActual === 'grid') {
      return `
        <article class="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
          <div class="relative h-48 w-full overflow-hidden cursor-pointer" onclick="abrirModalDetalle('${lugar.id}')">
            <img src="${lugar.imagen}" alt="${lugar.nombre}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-60"></div>
            
            <button onclick="event.stopPropagation(); toggleFavorito('${lugar.id}')" 
                    class="absolute top-3 right-3 p-2 rounded-full bg-slate-900/40 hover:bg-slate-900/70 backdrop-blur-sm transition-transform active:scale-90">
              <i data-lucide="heart" class="w-4 h-4 ${esFav ? 'text-rose-500 fill-rose-500' : 'text-white'}"></i>
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

            <div class="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-col gap-1.5 mb-4">
              <div class="flex items-center gap-2">
                <i data-lucide="clock" class="w-3.5 h-3.5 flex-shrink-0 text-slate-400"></i>
                <span class="truncate">${lugar.horario}</span>
              </div>
              <div class="flex items-center gap-2">
                <i data-lucide="ticket" class="w-3.5 h-3.5 flex-shrink-0 text-slate-400"></i>
                <span class="truncate font-medium">${lugar.precio}</span>
              </div>
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

    // VISTA 2: LISTA COMPACTA
    if (tipoVistaActual === 'lista') {
      return `
        <article class="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-sky-500 transition-all flex items-center gap-4">
          <img src="${lugar.imagen}" alt="${lugar.nombre}" loading="lazy" class="w-20 h-20 sm:w-28 sm:h-28 rounded-lg object-cover flex-shrink-0 cursor-pointer" onclick="abrirModalDetalle('${lugar.id}')">
          
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
            <button onclick="toggleFavorito('${lugar.id}')" class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <i data-lucide="heart" class="w-4 h-4 ${esFav ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}"></i>
            </button>
            <button onclick="abrirModalDetalle('${lugar.id}')" class="p-2 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 hover:bg-sky-100">
              <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </button>
          </div>
        </article>
      `;
    }

    // VISTA 3: ÍCONOS / GALERÍA FOTOGRÁFICA
    if (tipoVistaActual === 'iconos') {
      return `
        <article class="group relative h-64 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all" onclick="abrirModalDetalle('${lugar.id}')">
          <img src="${lugar.imagen}" alt="${lugar.nombre}" loading="lazy" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent"></div>
          
          <button onclick="event.stopPropagation(); toggleFavorito('${lugar.id}')" class="absolute top-3 right-3 p-2 rounded-full bg-slate-900/60 backdrop-blur-sm">
            <i data-lucide="heart" class="w-4 h-4 ${esFav ? 'text-rose-500 fill-rose-500' : 'text-white'}"></i>
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
  }).join('');

  lucide.createIcons();
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
  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
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
    filtrarDatos();
  });

  btnCercaDeMi?.addEventListener('click', alternarGeolocalizacion);

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
    if (e.key === 'Escape') cerrarModalDetalle();
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