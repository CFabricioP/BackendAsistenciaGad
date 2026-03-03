const express = require('express'); 
const router = express.Router();
const lugarController = require('../controllers/lugarController');
const fetch = require('node-fetch');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/authz');

// Solo autenticado
router.get('/', auth, lugarController.obtenerLugares);

// Solo Admin
router.post('/',      auth, requireRole(1), lugarController.crearLugar);
router.put('/:id',    auth, requireRole(1), lugarController.actualizarLugar);
router.delete('/:id', auth, requireRole(1), lugarController.eliminarLugar);

router.get('/nominatim/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Falta el parámetro q' });

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&limit=5&format=json&addressdetails=1`,
      { headers: { 'User-Agent': 'miapp@ejemplo.com' } }
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al buscar en Nominatim' });
  }
});
module.exports = router;