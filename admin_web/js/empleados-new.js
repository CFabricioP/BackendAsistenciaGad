document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formEmpleado');
  const lugar = document.getElementById('lugar');
  const mensaje = document.getElementById('mensaje');

  // Cargar lugares
  fetch('/api/lugares')
    .then(res => res.json())
    .then(data => {
      data.forEach(l => {
        const option = document.createElement('option');
        option.value = l.id;
        option.text = l.nombre;
        lugar.appendChild(option);
      });
    });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const body = {
      nombre: form.nombre.value,
      cedula: form.cedula.value,
      apellido: form.apellido.value,
      cargo: form.cargo.value,          // ✅ Se agregó esto
      lugar_id: form.lugar.value
      
    };

    const res = await fetch('/api/empleados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      mensaje.textContent = 'Empleado registrado exitosamente';
      form.reset();
    } else {
      const data = await res.json();
      mensaje.textContent = 'Error: ' + data.error;
    }
  });
});
