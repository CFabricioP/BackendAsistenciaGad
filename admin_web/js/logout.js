function cerrarSesion() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
    // Mensaje de cierre de sesión
  Swal.fire({
    icon: 'success',
    title: 'Sesión cerrada',
    text: 'Has cerrado sesión correctamente.',
    background: '#1e293b',
    color: '#fff',
    confirmButtonColor: '#1D4ED8'
  }).then(() => {
    // Redirigir al login
    window.location.href = 'login.html';
  });
}