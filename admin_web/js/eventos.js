
(async function () {
  let eventos = [];
  let empleados = [];

  async function loadEmpleados() {
    try { empleados = await apiFetch('/api/empleados', { headers: authHeaders() }); }
    catch (e) { toast('No se pudo cargar empleados','error'); }
  }

  function fillEventosSelects() {
    const sel1 = document.getElementById('ev-select');
    const sel2 = document.getElementById('as-ev');
    sel1.innerHTML = '<option value="">— Selecciona un evento —</option>';
    sel2.innerHTML = '';
    eventos.forEach(e => {
      sel1.add(new Option(`#${e.id} ${e.nombre}`, e.id));
      sel2.add(new Option(`#${e.id} ${e.nombre}`, e.id));
    });
  }

  function renderEventosTable() {
    const tb = document.querySelector('#tablaEventos tbody'); tb.innerHTML = '';
    eventos.forEach(e => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${e.id}</td>
        <td>${e.nombre}</td>
        <td>${e.fecha_inicio ?? ''}</td>
        <td>${e.fecha_fin ?? ''}</td>
        <td><button class="btn btn-sm btn-danger" data-del="${e.id}"><i class="fas fa-trash"></i></button></td>`;
      tb.appendChild(tr);
    });
  }

  function renderPuestos(eventoId) {
    const ev = eventos.find(x => String(x.id) === String(eventoId));
    const tb = document.querySelector('#tablaPuestos tbody'); tb.innerHTML = '';
    (ev?.puestos || []).forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${p.id}</td><td>${p.nombre}</td><td>${p.latitud}</td><td>${p.longitud}</td><td>${p.radio}</td>`;
      tb.appendChild(tr);
    });
  }

  async function loadEventos() {
    eventos = await apiFetch('/api/eventos', { headers: authHeaders() });
    renderEventosTable();
    fillEventosSelects();
    renderPuestos(document.getElementById('ev-select').value);
    fillAsignacionSelects();
  }

  // Crear evento
  document.getElementById('ev-crear').onclick = async ()=>{
    const nombre = document.getElementById('ev-nombre').value.trim();
    const fecha_inicio = document.getElementById('ev-inicio').value ? new Date(document.getElementById('ev-inicio').value).toISOString() : null;
    const fecha_fin = document.getElementById('ev-fin').value ? new Date(document.getElementById('ev-fin').value).toISOString() : null;
    const descripcion = document.getElementById('ev-desc').value.trim();
    if (!nombre) return toast('Nombre es obligatorio','warning');
    try {
      await apiFetch('/api/eventos', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ nombre, fecha_inicio, fecha_fin, descripcion })
      });
      toast('Evento creado','success');
      ['ev-nombre','ev-inicio','ev-fin','ev-desc'].forEach(id=>document.getElementById(id).value='');
      await loadEventos();
    } catch(e){ toast(e.message,'error'); }
  };

  // Eliminar evento
  document.getElementById('tablaEventos').addEventListener('click', async (ev)=>{
    const btn = ev.target.closest('button[data-del]'); if (!btn) return;
    const id = btn.getAttribute('data-del');
    if (!confirm('¿Eliminar evento #' + id + '?')) return;
    try {
      await apiFetch('/api/eventos/' + id, { method:'DELETE', headers: authHeaders() });
      toast('Evento eliminado','success');
      await loadEventos();
    } catch(e){ toast(e.message,'error'); }
  });

  // Cambio de evento seleccionado para ver/crear puestos
  document.getElementById('ev-select').onchange = function(){ renderPuestos(this.value); };

  // Crear puesto
  document.getElementById('pu-crear').onclick = async ()=>{
    const eventoId = document.getElementById('ev-select').value;
    if (!eventoId) return toast('Selecciona un evento','warning');
    const nombre = document.getElementById('pu-nombre').value.trim();
    const latitud = document.getElementById('pu-lat').value.trim();
    const longitud = document.getElementById('pu-lon').value.trim();
    const radio = Number(document.getElementById('pu-radio').value || 10);
    if (!nombre || !latitud || !longitud) return toast('Completa nombre/lat/lon','warning');

    try {
      await apiFetch(`/api/eventos/${eventoId}/puestos`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ nombre, latitud, longitud, radio })
      });
      toast('Puesto agregado','success');
      ['pu-nombre','pu-lat','pu-lon'].forEach(id=>document.getElementById(id).value='');
      document.getElementById('pu-radio').value='10';
      await loadEventos();
      document.getElementById('ev-select').value = eventoId;
      renderPuestos(eventoId);
    } catch(e){ toast(e.message,'error'); }
  };

  // ===== Asignaciones
  function fillAsignacionSelects() {
    const selEv = document.getElementById('as-ev');
    const selP  = document.getElementById('as-puesto');
    const selE  = document.getElementById('as-emp');
    selEv.innerHTML = ''; selP.innerHTML = ''; selE.innerHTML = '';
    eventos.forEach(e => selEv.add(new Option(`#${e.id} ${e.nombre}`, e.id)));
    (empleados || []).forEach(emp => selE.add(new Option(`${emp.id} ${emp.nombre||''} ${emp.apellido||''}`, emp.id)));

    function refreshPuestos() {
      selP.innerHTML = '';
      const ev = eventos.find(x => String(x.id) === String(selEv.value));
      (ev?.puestos || []).forEach(p => selP.add(new Option(`${p.id} - ${p.nombre}`, p.id)));
    }
    selEv.onchange = refreshPuestos;
    refreshPuestos();
  }

  document.getElementById('as-guardar').onclick = async ()=>{
    const eventoId = document.getElementById('as-ev').value;
    const puestoId = document.getElementById('as-puesto').value;
    const empId    = document.getElementById('as-emp').value;
    if (!eventoId || !puestoId || !empId) return toast('Selecciona evento, puesto y empleado','warning');
    try {
      await apiFetch(`/api/eventos/${eventoId}/asignaciones`, {
        method:'POST', headers: authHeaders(),
        body: JSON.stringify({ empleado_id: Number(empId), puesto_evento_id: Number(puestoId) })
      });
      toast('Asignación creada','success');
    } catch(e){ toast(e.message,'error'); }
  };

  await loadEmpleados();
  await loadEventos();
})();

