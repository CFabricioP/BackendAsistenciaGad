const express = require('express');
const router = express.Router();
const eventoController = require('../controllers/eventoController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/authz');

// Solo autenticado
router.get('/',    auth, eventoController.obtenerEventos);
router.get('/:id', auth, eventoController.obtenerEventoPorId);

// Solo Admin
router.post('/',      auth, requireRole(1), eventoController.crearEvento);
router.put('/:id',    auth, requireRole(1), eventoController.actualizarEvento);
router.delete('/:id', auth, requireRole(1), eventoController.eliminarEvento);

module.exports = router;