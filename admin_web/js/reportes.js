// admin_web/js/reportes.js
// Requiere IDs: desde, hasta, empleado, filtrar, limpiar, csv, tbodyReportes, sum-horas, sum-min, sum-seg
window.authHeaders = window.authHeaders || (extra => ({ 'Content-Type':'application/json', ...extra }));
window.apiFetch    = window.apiFetch    || (async (path, opts={}) => {
  const r = await fetch(path, opts); const t = await r.text();
  let d={}; try{ d=t?JSON.parse(t):{} }catch{ d={ raw:t } }
  if(!r.ok) throw new Error(d.message || d.error || ('HTTP '+r.status));
  return d;
});
window.toast       = window.toast       || ((msg,type='info') => {
  if (window.Swal) Swal.fire(type==='error'?'Error':type==='success'?'Éxito':'Aviso', msg, type);
  else alert(msg);
});

(function(){
  const el = id => document.getElementById(id);
  const elDesde=el('desde'), elHasta=el('hasta'), elEmpleado=el('empleado');
  const btnFiltrar=el('filtrar'), btnLimpiar=el('limpiar'), btnCSV=el('csv');
  const tbody=el('tbodyReportes'), outH=el('sum-horas'), outM=el('sum-min'), outS=el('sum-seg');

  const pad2=n=>String(n).padStart(2,'0');
  const parseHMS = str => { if(!str) return null; const p=String(str).split(':').map(Number); return {h:p[0]||0,m:p[1]||0,s:p[2]||0}; };
  const diffHMS = (a,b)=>{ a=parseHMS(a); b=parseHMS(b); if(!a||!b) return null; return Math.max(0,(b.h*3600+b.m*60+b.s)-(a.h*3600+a.m*60+a.s)); };
  const fmtS = s => { s=Math.max(0,Math.floor(s||0)); return `${pad2(Math.floor(s/3600))}:${pad2(Math.floor((s%3600)/60))}:${pad2(s%60)}`; };
  const ymd = d=>d.toISOString().slice(0,10);

  function setDefaults(){
    const now=new Date(); const d1=new Date(now); d1.setDate(d1.getDate()-7);
    elDesde.value = localStorage.getItem('reportes:desde') || ymd(d1);
    elHasta.value = localStorage.getItem('reportes:hasta') || ymd(now);
    elEmpleado.value = localStorage.getItem('reportes:empleadoId') || '';
  }
  function saveFilters(){
    localStorage.setItem('reportes:desde', elDesde.value||'');
    localStorage.setItem('reportes:hasta', elHasta.value||'');
    localStorage.setItem('reportes:empleadoId', elEmpleado.value||'');
  }
  function qs(){
    const q=new URLSearchParams();
    if (elDesde.value) q.set('desde',elDesde.value);
    if (elHasta.value) q.set('hasta',elHasta.value);
    if (elEmpleado.value) q.set('empleadoId',elEmpleado.value);
    return q.toString();
  }

  async function cargarEmpleados(){
    try{
      const data = await apiFetch('/api/empleados', { headers: authHeaders() });
      el('empleado').innerHTML = `<option value="">— Todos —</option>`;
      (data||[]).sort((a,b)=>(a.apellido||'').localeCompare(b.apellido||'')||(a.nombre||'').localeCompare(b.nombre||''))
        .forEach(e=> el('empleado').add(new Option(`${e.cedula||e.id} - ${(e.nombre||'')} ${(e.apellido||'')}`, e.id)));
      const selPrev = localStorage.getItem('reportes:empleadoId') || '';
      el('empleado').value = selPrev;
    }catch(e){ console.warn('No se pudieron cargar empleados', e); }
  }

  let LAST_ROWS=[];
  function renderRows(rows){
    tbody.innerHTML='';
    rows.forEach(r=>{
      const empleado = r.empleado || r.empleado_nombre || r.user_nombre || r.user_id || '';
      const lugar    = r.workplace || r.lugar || r.lugar_nombre || r.workplace_id || '—';
      const durSeg   = (r.duracion_seg!=null) ? r.duracion_seg : diffHMS(r.hora_entrada, r.hora_salida);
      const tr=document.createElement('tr');
      tr.innerHTML = `
        <td>${r.fecha ?? ''}</td>
        <td>${r.hora_entrada ?? '—'}</td>
        <td>${r.hora_salida  ?? '—'}</td>
        <td>${empleado}</td>
        <td>${lugar}</td>
        <td>${durSeg!=null? fmtS(durSeg) : '—'}</td>`;
      tbody.appendChild(tr);
    });
  }

  async function cargarTablaYResumen(){
    saveFilters();
    const q = qs();
    try {
      btnFiltrar && (btnFiltrar.disabled=true);
      const list = await apiFetch('/api/asistencias?'+q, { headers: authHeaders() });
      const rows = Array.isArray(list) ? list : (list.data || list.rows || []);
      LAST_ROWS = rows; renderRows(rows);
    } catch(e){
      LAST_ROWS=[]; renderRows(LAST_ROWS);
      if (window.Swal) Swal.fire('Error','No se pudieron cargar los reportes','error'); else toast('No se pudieron cargar los reportes','error');
    } finally { btnFiltrar && (btnFiltrar.disabled=false); }

    try {
      const r = await apiFetch('/api/asistencias/resumen?'+q, { headers: authHeaders() });
      outH.textContent = r.horas??0; outM.textContent = r.minutos??0; outS.textContent = r.segundos??0;
    } catch { outH.textContent=0; outM.textContent=0; outS.textContent=0; }
  }

  function exportCSV(){
    if (!LAST_ROWS.length) return toast('No hay datos para exportar','warning');
    const headers = ['Fecha','Entrada','Salida','Empleado','Lugar de trabajo','Duración (h:m:s)'];
    const lines=[headers.join(',')];
    LAST_ROWS.forEach(r=>{
      const empleado = r.empleado || r.empleado_nombre || r.user_nombre || r.user_id || '';
      const lugar    = r.workplace || r.lugar || r.lugar_nombre || r.workplace_id || '—';
      const durSeg   = (r.duracion_seg!=null) ? r.duracion_seg : diffHMS(r.hora_entrada, r.hora_salida);
      lines.push([r.fecha??'', r.hora_entrada??'', r.hora_salida??'', empleado, lugar, durSeg!=null?fmtS(durSeg):'']
        .map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','));
    });
    const blob=new Blob([lines.join('\n')],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a');
    a.href=url; a.download=`reporte_asistencias_${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),500);
  }

  btnFiltrar && btnFiltrar.addEventListener('click', cargarTablaYResumen);
  btnLimpiar && btnLimpiar.addEventListener('click', ()=>{ elDesde.value=''; elHasta.value=''; elEmpleado.value=''; cargarTablaYResumen(); });
  btnCSV && btnCSV.addEventListener('click', exportCSV);
  elEmpleado && elEmpleado.addEventListener('change', cargarTablaYResumen);

  setDefaults();
  cargarEmpleados().then(cargarTablaYResumen);
})();
