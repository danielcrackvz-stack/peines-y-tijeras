// ==========================================================================
// Peines y Tijeras — Catálogo Oficial de Servicios Capilares Femeninos
// ==========================================================================

export const SERVICIOS_CAPILARES = [
  {
    id: "corte-bob",
    nombre: "Corte Bob Clásico",
    categoria: "Corte",
    precio: "Bs. 35 - 50",
    descripcion: "Corte geométrico a la altura del mentón que estiliza el cuello y realza facciones con precisión.",
    imagen: "assets/peines1.jpg"
  },
  {
    id: "capas-largas",
    nombre: "Capas Largas y Brushing",
    categoria: "Corte",
    precio: "Bs. 40 - 60",
    descripcion: "Aporta movimiento, ligereza y volumen natural en cabellos medios y largos sin sacrificar el largo.",
    imagen: "assets/peines2.jpg"
  },
  {
    id: "color-cobrizo",
    nombre: "Colorimetría y Tono Cobrizo",
    categoria: "Color",
    precio: "Bs. 120 - 220",
    descripcion: "Aplicación de matices cálidos dimensionales (canela, ámbar o cobre) con nutrición capilar.",
    imagen: "assets/peines3.jpg"
  },
  {
    id: "alizado-keratina",
    nombre: "Alisado Termoactivo y Keratina",
    categoria: "Alizado",
    precio: "Bs. 150 - 280",
    descripcion: "Tratamiento reconstructivo profundo para eliminar el frizz, aportar sedosidad y brillo duradero.",
    imagen: "assets/peines4.jpg"
  },
  {
    id: "visagismo-personalizado",
    nombre: "Asesoría de Visagismo Personalizada",
    categoria: "Cambio de look",
    precio: "Bs. 50 - 80",
    descripcion: "Diagnóstico completo de estructura facial, proporciones óseas y tono de piel para definir tu look ideal.",
    imagen: "assets/peines5.jpg"
  }
];

export function renderizarServicios(contenedorId = "teaserGrid", categoriaFiltro = "Todos") {
  const grid = document.getElementById(contenedorId);
  if (!grid) return;

  const listaFiltrada = categoriaFiltro === "Todos" 
    ? SERVICIOS_CAPILARES 
    : SERVICIOS_CAPILARES.filter(s => s.categoria.toLowerCase() === categoriaFiltro.toLowerCase());

  grid.innerHTML = listaFiltrada.map(s => `
    <article class="service-card">
      <div class="service-img-wrap">
        <img src="${s.imagen}" alt="${s.nombre}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=700&q=80'">
        <span class="badge-cat">${s.categoria}</span>
      </div>
      <div class="service-body">
        <h3>${s.nombre}</h3>
        <p class="desc">${s.descripcion}</p>
        <div class="service-footer">
          <span class="price">${s.precio}</span>
          <a href="reservas.html?servicio=${encodeURIComponent(s.nombre)}" class="btn-reservar-card">
            Agendar cita →
          </a>
        </div>
      </div>
    </article>
  `).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  renderizarServicios("teaserGrid");
});