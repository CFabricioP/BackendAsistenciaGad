(async function () {

  const todayStr = () => new Date().toISOString().slice(0, 10);

  async function safeFetch(path, opts) {
    try { return await apiFetch(path, opts); } catch { return null; }
  }

  // ── 1) KPIs: empleados y lugares ──
  const [empleados, lugares] = await Promise.all([
    safeFetch('/api/empleados', { headers: authHeaders() }),
    safeFetch('/api/lugares',   { headers: authHeaders() })
  ]);

  const mapEmp = new Map();
  (empleados || []).forEach(e => mapEmp.set(e.id, `${e.nombre || ''} ${e.apellido || ''}`.trim()));

  document.getElementById('kpi-empleados').textContent = (empleados || []).length || '0';
  document.getElementById('kpi-lugares').textContent   = (lugares   || []).length || '0';

  // ── 2) Asistencias de hoy ──
  const hoy     = todayStr();
  const listHoy = await safeFetch(`/api/asistencias?desde=${hoy}&hasta=${hoy}&pageSize=500`, { headers: authHeaders() });
  const rows    = (listHoy && listHoy.data) ? listHoy.data : [];

  const kpiAsis = document.getElementById('kpi-asistencias-hoy');
  if (kpiAsis) kpiAsis.textContent = rows.length;

  // Render "Últimas entradas de hoy"
  const ultimos = [...rows]
    .sort((a, b) => (b.hora_entrada || '').localeCompare(a.hora_entrada || ''))
    .slice(0, 10);

  const tbEnt = document.querySelector('#tablaEntradas tbody');
  tbEnt.innerHTML = '';

  if (ultimos.length === 0) {
    tbEnt.innerHTML = '<tr class="empty-row"><td colspan="3">Sin registros hoy</td></tr>';
  } else {
    ultimos.forEach(r => {
      const emp   = mapEmp.get(r.empleado_id) || mapEmp.get(r.user_id) || '-';
      const lugar = r.lugar?.nombre || r.lugar_id || '-';
      const hora  = r.hora_entrada
        ? new Date(`1970-01-01T${r.hora_entrada}`).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
        : '-';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="badge-hora"><i class="fas fa-clock"></i> ${hora}</span></td>
        <td>${emp}</td>
        <td>${lugar}</td>
      `;
      tbEnt.appendChild(tr);
    });
  }

  // ── 3) Eventos próximos (7 días) ──
  const eventos  = await safeFetch('/api/eventos', { headers: authHeaders() });
  console.log('Eventos raw:', eventos);

  const proximos = (eventos || []).filter(ev => {
    console.log('ev.fecha:', ev.fecha);
    if (!ev.fecha) return false;
    const diff = (new Date(ev.fecha) - new Date()) / (1000 * 60 * 60 * 24);
      console.log('diff días:', diff);
    return diff >= -0.5 && diff <= 7;
  }).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
console.log('Próximos filtrados:', proximos);

  const kpiEv = document.getElementById('kpi-eventos');
  if (kpiEv) kpiEv.textContent = (eventos || []).length || '0';

  const tbEv = document.querySelector('#tablaEventosDash tbody');
  tbEv.innerHTML = '';

  if (proximos.length === 0) {
    tbEv.innerHTML = '<tr class="empty-row"><td colspan="3">Sin eventos próximos</td></tr>';
  } else {
    proximos.slice(0, 10).forEach(ev => {
      const fecha = ev.fecha
        ? new Date(ev.fecha).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
        : '-';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="badge-evento"><i class="fas fa-calendar-alt"></i> ${fecha}</span></td>
        <td>${ev.titulo || '-'}</td>
        <td>${ev.hora   || '-'}</td>
      `;
      tbEv.appendChild(tr);
    });
  }

  // ── 4) Puntos de encuentro (KPI) ──
  const puntos  = await safeFetch('/api/puntos-encuentro', { headers: authHeaders() });
  const kpiPunt = document.getElementById('kpi-puntos');
  if (kpiPunt) kpiPunt.textContent = (puntos || []).length || '0';

})();

// -- FCM Notificaciones: contar total y mostrar en KPI
(async function () {
  const res = await apiFetch('/api/notificaciones/count', { headers: authHeaders() });
  const kpiNotifs = document.getElementById('kpi-notificaciones');
  if (kpiNotifs) kpiNotifs.textContent = res ? res.totalNotificaciones : '0';
})();