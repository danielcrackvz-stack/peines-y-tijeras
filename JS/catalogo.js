import { fetchServicios } from "./servicios.js";

let TODOS_LOS_SERVICIOS = [];
let categoriaActiva = "Todos";

function renderServicios() {
  const grid = document.getElementById("serviceGrid");
  if (!grid) return;

  const lista =
    categoriaActiva === "Todos"
      ? TODOS_LOS_SERVICIOS
      : TODOS_LOS_SERVICIOS.filter((s) => s.categoria === categoriaActiva);

  if (lista.length === 0) {
    grid.innerHTML = `<p class="state-msg">Todavía no hay servicios cargados en esta categoría.</p>`;
    return;
  }

  grid.innerHTML = lista
    .map((s) => {
      const nombreParam = encodeURIComponent(s.nombre);
      return `
      <article class="service-card">
        <span class="cat">${s.categoria ?? ""}</span>
        <h3>${s.nombre}</h3>
        <p class="desc">${s.descripcion ?? ""}</p>
        <span class="price">${s.precio ?? ""}</span>
        <a class="reservar" href="reservas.html?servicio=${nombreParam}">Reservar este servicio →</a>
      </article>`;
    })
    .join("");
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