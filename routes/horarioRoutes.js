const express = require('express');
const router = express.Router();
const horarioController = require('../controllers/horarioController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/authz');

// ── Admin ──
router.post('/',                          auth, requireRole(1), horarioController.crearHorario);
router.get('/',                           auth, requireRole(1), horarioController.obtenerHorarios);
router.put('/:id',                        auth, requireRole(1), horarioController.actualizarHorario);
router.delete('/:id',                     auth, requireRole(1), horarioController.eliminarHorario);
router.post('/asignar',                   auth, requireRole(1), horarioController.asignarHorario);
router.get('/empleado/:empleado_id',      auth, requireRole(1), horarioController.obtenerHorarioDeEmpleado);

// ── Empleado ──
router.get('/mi-horario',                 auth, horarioController.miHorario);

// ── Dinámica al final ──
router.get('/:id',                        auth, requireRole(1), horarioController.obtenerHorarioPorId);

module.exports = router;