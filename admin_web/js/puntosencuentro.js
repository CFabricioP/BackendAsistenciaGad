<script>
(async function () {
  async function cargar() {
    const data = await apiFetch('/api/puntos-encuentro', { headers: authHeaders() });
    const tb = document.querySelector('#tablaPE tbody'); tb.innerHTML = '';
    (data || []).forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.id}</td><td>${p.nombre}</td><td>${p.latitud}</td><td>${p.longitud}</td><td>${p.radio}</td>
        <td><button class="btn btn-sm btn-danger" data-del="${p.id}"><i class="fas fa-trash"></i></button></td>`;
      tb.appendChild(tr);
    });
  }

  document.getElementById('pe-crear').onclick = async ()=>{
    const nombre = document.getElementById('pe-nombre').value.trim();
    const latitud = document.getElementById('pe-lat').value.trim();
    const longitud = document.getElementById('pe-lon').value.trim();
    const radio = Number(document.getElementById('pe-radio').value || 10);
    if (!nombre || !latitud || !longitud) return toast('Completa nombre/lat/lon','warning');
    try {
      await apiFetch('/api/puntos-encuentro', {
        method:'POST', headers: authHeaders(),
        body: JSON.stringify({ nombre, latitud, longitud, radio })
      });
      toast('Punto creado','success');
      ['pe-nombre','pe-lat','pe-lon'].forEach(id=>document.getElementById(id).value='');
      document.getElementById('pe-radio').value='10';
      await cargar();
    } catch(e){ toast(e.message,'error'); }
  };

  document.getElementById('tablaPE').addEventListener('click', async (ev)=>{
    const btn = ev.target.closest('button[data-del]'); if (!btn) return;
    const id = btn.getAttribute('data-del');
    if (!confirm('¿Eliminar punto #' + id + '?')) return;
    try {
      await apiFetch('/api/puntos-encuentro/' + id, { method:'DELETE', headers: authHeaders() });
      toast('Eliminado','success'); await cargar();
    } catch(e){ toast(e.message,'error'); }
  });

  await cargar();
})();
</script>
