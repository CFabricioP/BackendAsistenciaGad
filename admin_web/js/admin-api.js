// admin_web/js/admin-api.js

// ✅ Protección de rutas
(function() {
  const token = localStorage.getItem('token');
  const esLogin = window.location.pathname.includes('login.html');
  if (!token && !esLogin) {
    window.location.replace('login.html');
  }
})();

// Lo demás igual
window.authHeaders = function(extra={}) {
  const t = localStorage.getItem('admin_token') || localStorage.getItem('token') || localStorage.getItem('jwt') || '';
  return { 'Content-Type':'application/json', ...(t?{Authorization:'Bearer '+t}:{}) , ...extra };
};
window.apiFetch = async function(path, opts={}) {
  const res = await fetch(path, opts);
  const text = await res.text(); let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw:text }; }
  if (!res.ok) throw new Error(data.message || data.error || ('HTTP '+res.status));
  return data;
};
window.toast = function(msg, type='info'){
  if (window.Swal) Swal.fire(type==='error'?'Error':type==='success'?'Éxito':'Aviso', msg, type);
  else alert(msg);
};