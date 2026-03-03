
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLugar");
  const nombreInput = document.getElementById("nombreLugar");
  const ubicacionInput = document.getElementById("ubicacion");
  const latitudInput = document.getElementById("latitud");
  const longitudInput = document.getElementById("longitud");
  const tabla = document.getElementById("tablaLugares");
  const mensaje = document.getElementById("mensaje");

  const mapa = L.map("mapa").setView([-0.1807, -78.4678], 14);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(mapa);

  let marcador;
  let modoEdicion = false;
  let idLugarEditando = null;

  // ===================== NUEVO: helpers =====================
  function isValidLatLng(lat, lng) {
    return Number.isFinite(lat) && Number.isFinite(lng) &&
           lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  function setInputsFromLatLng(lat, lng) {
    latitudInput.value  = Number(lat).toFixed(6);
    longitudInput.value = Number(lng).toFixed(6);
  }

  // Usa tu proxy existente para autocompletar (opcional)
  async function reverseGeocode(lat, lng) {
    try {
      const response = await fetch(`/api/lugares/nominatim?lat=${lat}&lon=${lng}`);
      if (!response.ok) return;
      const data = await response.json();
     if (data.name) {
        nombreInput.value = data.name;}
      if (data.display_name) {ubicacionInput.value = data.display_name}
    } catch (_) {}
  }

  // Crea o mueve el marcador y centra el mapa
  function placeOrMoveMarker(lat, lng, { zoom = 16, center = true } = {}) {
    if (!marcador) {
      marcador = L.marker([lat, lng], { draggable: true }).addTo(mapa);

      // Cuando el usuario arrastra el marcador → actualizar inputs y autocompletar
      marcador.on("move", (e) => {
        const { lat, lng } = e.latlng;
        setInputsFromLatLng(lat, lng);
      });

      marcador.on("moveend", (e) => {
        const { lat, lng } = e.target.getLatLng();
        reverseGeocode(lat, lng);
      });
    } else {
      marcador.setLatLng([lat, lng]);
    }

    if (center) mapa.setView([lat, lng], zoom);
    setInputsFromLatLng(lat, lng);
  }

  // Cuando el usuario escribe manualmente lat/lon → mover marcador
  function onManualCoords() {
    const lat = parseFloat((latitudInput.value || "").toString().replace(",", "."));
    const lng = parseFloat((longitudInput.value || "").toString().replace(",", "."));

    if (!isValidLatLng(lat, lng)) return; // no mover si no es válido
    placeOrMoveMarker(lat, lng, { center: true, zoom: 18 });
    reverseGeocode(lat, lng);
  }

  // Escuchar cambios manuales (NUEVO)
  latitudInput.addEventListener("change", onManualCoords);
  longitudInput.addEventListener("change", onManualCoords);
  latitudInput.addEventListener("blur", onManualCoords);
  longitudInput.addEventListener("blur", onManualCoords);
  // ==========================================================

  // Click en el mapa (mantiene lo existente, pero usando helper)
  mapa.on("click", async (e) => {
    const { lat, lng } = e.latlng;
    placeOrMoveMarker(lat, lng, { center: true, zoom: 18 });

    try {
      const response = await fetch(`/api/lugares/nominatim?lat=${lat}&lon=${lng}`);
      const data = await response.json();
      if (data.name) nombreInput.value = data.name;
      if (data.display_name) ubicacionInput.value = data.display_name;
    } catch (error) {
      console.error("Error al autocompletar:", error);
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    mensaje.textContent = "";
    const lugar = {
      nombre: nombreInput.value,
      ubicacion: ubicacionInput.value,
      latitud: latitudInput.value,
      longitud: longitudInput.value
    };

    try {
      let res, data;
      if (modoEdicion) {
        res = await fetch(`/api/lugares/${idLugarEditando}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(lugar)
        });
      } else {
        res = await fetch("/api/lugares", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(lugar)
        });
      }

      data = await res.json();

      if (res.ok) {
        mensaje.textContent = modoEdicion ? "Lugar actualizado" : "Lugar registrado";
        form.reset();
        if (marcador) { mapa.removeLayer(marcador); marcador = null; }
        modoEdicion = false;
        idLugarEditando = null;
        cargarLugares();
      } else {
        mensaje.textContent = "Error: " + (data.error || "Operación fallida");
      }
    } catch (err) {
      mensaje.textContent = "Error de conexión";
      console.error(err);
    }
  });

  async function cargarLugares() {
    try {
      const res = await fetch("/api/lugares");
      const lugares = await res.json();
      tabla.innerHTML = "";
      lugares.forEach(agregarFila);
    } catch (err) {
      console.error("Error al cargar lugares:", err);
    }
  }

  function agregarFila(lugar) {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${lugar.nombre}</td>
      <td>${lugar.ubicacion}</td>
      <td>${lugar.latitud}</td>
      <td>${lugar.longitud}</td>
      <td>
        <button class="btn btn-warning btn-sm btn-editar" data-id="${lugar.id}">Editar</button>
        <button class="btn btn-danger btn-sm btn-eliminar" data-id="${lugar.id}">Eliminar</button>
      </td>
    `;
    tabla.appendChild(fila);

    fila.querySelector(".btn-eliminar").addEventListener("click", async () => {
      if (confirm(`¿Deseas eliminar el lugar "${lugar.nombre}"?`)) {
        try {
          const res = await fetch(`/api/lugares/${lugar.id}`, { method: "DELETE" });
          if (res.ok) {
            fila.remove();
            alert("Lugar eliminado.");
          } else {
            alert("No se pudo eliminar el lugar.");
          }
        } catch (err) {
          console.error("Error al eliminar:", err);
        }
      }
    });

    fila.querySelector(".btn-editar").addEventListener("click", () => {
      nombreInput.value = lugar.nombre;
      ubicacionInput.value = lugar.ubicacion;
      latitudInput.value = lugar.latitud;
      longitudInput.value = lugar.longitud;

      // Usar helper (NUEVO) en modo edición:
      const lat = parseFloat(lugar.latitud);
      const lng = parseFloat(lugar.longitud);
      if (isValidLatLng(lat, lng)) {
        placeOrMoveMarker(lat, lng, { center: true, zoom: 16 });
      }

      modoEdicion = true;
      idLugarEditando = lugar.id;
      mensaje.textContent = "Editando lugar: " + lugar.nombre;
    });
  }

  cargarLugares();
});

