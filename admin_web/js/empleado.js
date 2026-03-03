document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('formEmpleado');
  const tabla = document.getElementById('tablaEmpleados');
  const lugarSelect = document.getElementById('lugar_id');
  const buscador = document.getElementById('buscador');
  const btnAnterior = document.getElementById('btnAnterior');
  const btnSiguiente = document.getElementById('btnSiguiente');
  const paginacionInfo = document.getElementById('paginacionInfo');
  const rolSelect = document.getElementById('rol'); // ← NUEVO

  let empleadosOriginal = [];
  let paginaActual = 1;
  const empleadosPorPagina = 5;

  // Cargar los lugares disponibles
  async function cargarLugares() {
    const res = await fetch('/api/lugares');
    const lugares = await res.json();
    lugarSelect.innerHTML = '<option value="">Seleccione un lugar</option>';
    lugares.forEach(l => {
      const option = document.createElement('option');
      option.value = l.id;
      option.textContent = l.nombre;
      lugarSelect.appendChild(option);
    });
  }

  // Enviar nuevo empleado
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
      cedula: form.cedula.value,
      nombre: form.nombre.value,
      apellido: form.apellido.value,
      cargo: form.cargo.value,
      lugar_id: form.lugar_id.value,
      rol: rolSelect.value // ← NUEVO
    };
    if (!body.cedula || !body.nombre || !body.apellido || !body.cargo || !body.lugar_id || !body.rol) {
      return alert('Por favor complete todos los campos.');
    }
    const res = await fetch('/api/empleados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      form.reset();
      cargarEmpleados();
    } else {
      const error = await res.json();
      alert('Error al registrar empleado: ' + error.message);
    }
  });

  buscador.addEventListener('input', () => {
    paginaActual = 1;
    renderTabla(filtrarEmpleados(buscador.value));
  });

  btnAnterior.addEventListener('click', () => {
    if (paginaActual > 1) {
      paginaActual--;
      renderTabla(filtrarEmpleados(buscador.value));
    }
  });

  btnSiguiente.addEventListener('click', () => {
    const totalPaginas = Math.ceil(filtrarEmpleados(buscador.value).length / empleadosPorPagina);
    if (paginaActual < totalPaginas) {
      paginaActual++;
      renderTabla(filtrarEmpleados(buscador.value));
    }
  });

  async function cargarEmpleados() {
    const res = await fetch('/api/empleados');
    empleadosOriginal = await res.json();
    renderTabla(filtrarEmpleados(buscador.value));
  }

  function filtrarEmpleados(query) {
    return empleadosOriginal.filter(emp =>
      emp.cedula.includes(query) ||
      emp.nombre.toLowerCase().includes(query.toLowerCase()) ||
      emp.apellido.toLowerCase().includes(query.toLowerCase())
    );
  }

  function renderTabla(empleados) {
    tabla.innerHTML = '';
    const totalPaginas = Math.ceil(empleados.length / empleadosPorPagina);
    const inicio = (paginaActual - 1) * empleadosPorPagina;
    const empleadosPagina = empleados.slice(inicio, inicio + empleadosPorPagina);

    empleadosPagina.forEach((emp, index) => {
      const fila = `
        <tr>
          <td>${inicio + index + 1}</td>
          <td>${emp.cedula}</td>
          <td>${emp.nombre}</td>
          <td>${emp.apellido}</td>
          <td>${emp.cargo || 'Sin cargo'}</td>
          <td>${emp.nombre_lugar || 'Sin asignar'}</td>
          <td>${emp.rol || 'Sin rol'}</td> <!-- NUEVA COLUMNA -->
        </tr>`;
      tabla.innerHTML += fila;
    });

    paginacionInfo.textContent = `Página ${paginaActual} de ${totalPaginas}`;
    btnAnterior.disabled = paginaActual === 1;
    btnSiguiente.disabled = paginaActual === totalPaginas;
  }

  cargarLugares();
  cargarEmpleados();
});
