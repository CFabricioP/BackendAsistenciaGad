document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const cedula       = document.getElementById('cedula').value.trim();
  const password     = document.getElementById('password').value.trim();
  const mensajeError = document.getElementById('mensajeError');
  const btnLogin     = document.getElementById('btnLogin'); // agrega id al botón

  mensajeError.textContent = '';
  btnLogin.disabled = true;
  btnLogin.textContent = 'Iniciando sesión...';

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cedula, password })
    });

    const data = await response.json();

    if (!response.ok) {
      mensajeError.textContent = data.error || 'Credenciales inválidas.';
      return;
    }

    if (data.rol?.toLowerCase().trim() !== 'admin') {
      mensajeError.textContent = 'Acceso denegado: No tienes permisos de administrador.';
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.empleado));
    window.location.href = 'dashboard.html';

  } catch (error) {
    mensajeError.textContent = 'Error al conectar con el servidor.';
  } finally {
    btnLogin.disabled = false;
    btnLogin.textContent = 'Iniciar sesión';
  }
});