(async function () {
  let EMPLEADOS = [];
  let FILTRO = '';

  // 👇 Agrega estas referencias que faltaban
  const combo      = document.getElementById('comboEmpleados');
  const buscar     = document.getElementById('buscarEmpleado');
  const btnAgregar = document.getElementById('btnAgregarSeleccion');
  const resumen    = document.getElementById('seleccionadosResumen');
  const selBadge   = document.getElementById('selCountBadge');
  const contBadge  = document.getElementById('contadorBadge');
  const btnCopyIds = document.getElementById('btnCopyIds');
  const btnEnviar = document.getElementById('enviar');
  const btnReload = document.getElementById('btnReloadEmps');
  const btnSelAll = document.getElementById('btnSelectAll');
  const btnBroadcast = document.getElementById('btnBroadcast');
  let SELECCIONADOS = []; // empleados agregados a la selección

  // ... (tus referencias existentes)

  function normalizar(str) {
    return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function renderCombo() {
    if (!combo) return;
    const filtro = normalizar(FILTRO);
    combo.innerHTML = '';

    const listaFiltrada = (EMPLEADOS || []).filter(e => {
      if (!filtro) return true;
      const texto = normalizar(`${e.id} ${e.cedula || ''} ${e.nombre || ''} ${e.apellido || ''}`);
      return texto.includes(filtro);
    });

    if (listaFiltrada.length === 0) {
      combo.add(new Option('No hay coincidencias', ''));
      return;
    }

    listaFiltrada.forEach(e => {
      combo.add(new Option(`${e.id} - ${e.nombre || ''} ${e.apellido || ''} (${e.cedula || ''})`, e.id));
    });
  }

  function renderSeleccionados() {
    if (!resumen) return;
    resumen.innerHTML = '';
    if (selBadge) selBadge.textContent = SELECCIONADOS.length;
    if (contBadge) contBadge.textContent = `${SELECCIONADOS.length} seleccionados`;

    SELECCIONADOS.forEach(e => {
      const div = document.createElement('div');
      div.className = 'd-flex justify-content-between align-items-center py-1 border-bottom';
      div.innerHTML = `
        <span><strong>${e.nombre || ''} ${e.apellido || ''}</strong> <small class="text-muted">(${e.cedula || ''})</small></span>
        <button class="btn btn-sm btn-outline-danger btn-remove" data-id="${e.id}">
          <i class="fas fa-times"></i>
        </button>`;
      resumen.appendChild(div);
    });

    resumen.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        SELECCIONADOS = SELECCIONADOS.filter(e => e.id !== Number(btn.dataset.id));
        renderSeleccionados();
      });
    });
  }

  // 👇 Conecta el buscador al combo
  if (buscar) buscar.addEventListener('input', e => {
    FILTRO = e.target.value;
    renderCombo(); // antes llamabas renderLista(), ahora también actualiza el combo
  });

  // 👇 Botón agregar al seleccionado
  if (btnAgregar && combo) btnAgregar.addEventListener('click', () => {
    const id = Number(combo.value);
    if (!id) return;
    const emp = EMPLEADOS.find(e => e.id === id);
    if (!emp) return;
    if (SELECCIONADOS.find(e => e.id === id)) return toast('Ya está en la selección', 'warning');
    SELECCIONADOS.push(emp);
    renderSeleccionados();
  });

  // 👇 Copiar IDs
  if (btnCopyIds) btnCopyIds.addEventListener('click', () => {
    const ids = SELECCIONADOS.map(e => e.id).join(', ');
    navigator.clipboard.writeText(ids);
    toast('IDs copiados', 'success');
  });

  async function cargarEmpleados() {
    try {
      const data = await apiFetch('/api/empleados', { headers: authHeaders() });
      EMPLEADOS = (data || []).sort((a, b) =>
        (a.apellido || '').localeCompare(b.apellido || '') || (a.nombre || '').localeCompare(b.nombre || ''));
      renderCombo(); // 👈 ahora renderiza el combo
    } catch (e) { toast('No se pudo cargar empleados: ' + (e.message || e), 'error'); }
  }
cargarEmpleados();
//Btn para enviar notificación a empleados seleccionados
btnEnviar && btnEnviar.addEventListener('click', async () => {
    const titulo = (document.getElementById('titulo')||{}).value?.trim();
    const cuerpo = (document.getElementById('cuerpo')||{}).value?.trim();
    const ids = SELECCIONADOS.map(e => e.id); // 👈 único cambio
    if (!titulo || !cuerpo) return toast('Completa título y cuerpo', 'warning');
    if (!ids.length) return toast('Selecciona al menos un empleado', 'warning');
    btnEnviar.disabled = true;
    try {
      await apiFetch('/api/notificaciones', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ titulo, cuerpo, empleadosIds: ids }) });
      toast('Notificaciones enviadas', 'success');
    } catch(e) { toast('Error: ' + (e.message || e), 'error'); }
    finally { btnEnviar.disabled = false; }
});
btnBroadcast && btnBroadcast.addEventListener('click', async () => {
    const titulo = (document.getElementById('titulo')||{}).value?.trim();
    const cuerpo = (document.getElementById('cuerpo')||{}).value?.trim();
    if (!titulo || !cuerpo) return toast('Completa título y cuerpo', 'warning');
    btnBroadcast.disabled = true;
    try {
      await apiFetch('/api/notificaciones/broadcast', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ titulo, cuerpo }) });
      toast('Notificaciones enviadas', 'success');
    } catch(e) { toast('Error: ' + (e.message || e), 'error'); }
    finally { btnBroadcast.disabled = false; }
});
//Btn para recargar el listado de empleados seleccionadosResumen
if (btnReload) btnReload.addEventListener('click', () => {
    SELECCIONADOS = []; // 👈 limpia el array
    renderSeleccionados(); // 👈 actualiza el resumen visual
    cargarEmpleados();
    cargarTokenStats();
});
if (btnSelAll) btnSelAll.addEventListener('click', () => {
    SELECCIONADOS = [...EMPLEADOS]; // 👈 agrega todos al array
    renderSeleccionados();
});

  // ... resto de tu código (btnEnviar, btnBc, etc.)
  // En btnEnviar cambia la fuente de IDs a SELECCIONADOS:
  // const ids = SELECCIONADOS.map(e => e.id);
window.agregarEmpleadoASeleccion = function(emp) {
    if (!emp || !emp.id) return false;
    if (SELECCIONADOS.find(e => e.id === emp.id)) return false;
    SELECCIONADOS.push(emp);
    renderSeleccionados();
    return true;
  };
  window.reemplazarSeleccion = function(empleados) {
    SELECCIONADOS = [...empleados];
    renderSeleccionados();
  };
})(); // ← ya existe
