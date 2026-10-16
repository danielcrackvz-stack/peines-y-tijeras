import { fetchServicios } from "./servicios.js";

let TODOS_LOS_SERVICIOS = [];
let categoriaActiva = "Todos";

function renderServicios() {
  const grid = document.getElementById("serviceGrid");
  if (!grid) return;

  const lista = (categoriaActiva === "Todos")
    ? TODOS_LOS_SERVICIOS
    : TODOS_LOS_SERVICIOS.filter((s) => s.categoria.toLowerCase() === categoriaActiva.toLowerCase());

  if (lista.length === 0) {
    grid.innerHTML = `<p class="state-msg" style="grid-column: 1/-1; text-align: center; padding: 40px 0;">No hay servicios registrados en esta categoría.</p>`;
    return;
  }

  grid.innerHTML = lista.map((s) => {
    const imagenSrc = s.imagen || "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=600&q=80";
    const param = encodeURIComponent(s.nombre);
    return `
      <article class="service-card">
        <div class="service-img-wrap">
          <img src="${imagenSrc}" alt="${s.nombre}" loading="lazy">
        </div>
        <div class="service-body">
          <span class="cat">${s.categoria || "Capilar"}</span>
          <h3>${s.nombre}</h3>
          <p class="desc">${s.descripcion || ""}</p>
          <div class="price">${s.precio || "A consultar"}</div>
          <a class="btn-reservar-card" href="reservas.html?servicio=${param}">Reservar turno →</a>
        </div>
      </article>
    `;
  }).join("");
}

function setupFiltros() {
  const filtros = document.querySelectorAll(".filter-btn");
  filtros.forEach((btn) => {
    btn.addEventListener("click", () => {
      filtros.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      categoriaActiva = btn.dataset.cat;
      renderServicios();
    });
  });
}

async function init() {
  setupFiltros();
  TODOS_LOS_SERVICIOS = await fetchServicios();
  renderServicios();
}

init();