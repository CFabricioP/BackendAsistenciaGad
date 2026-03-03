document.addEventListener('DOMContentLoaded', async () => {
  const map = L.map('map').setView([0.3392, -78.1909], 13); // Cotacachi por defecto

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  try {
    const response = await fetch('/api/lugares');
    const lugares = await response.json();

    lugares.forEach(lugar => {
      if (lugar.latitud && lugar.longitud) {
        L.marker([parseFloat(lugar.latitud), parseFloat(lugar.longitud)])
          .addTo(map)
          .bindPopup(`<b>${lugar.nombre}</b><br>${lugar.ubicacion}`);
      }
    });
  } catch (error) {
    console.error('Error al cargar lugares:', error);
    alert('Error al cargar el mapa.');
  }
});
