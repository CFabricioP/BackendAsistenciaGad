const express = require('express');
const router = express.Router();
const empleadoGrupoController = require('../controllers/empleadoGrupoController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/authz');
// Solo autenticado
router.get('/grupo/:id',    auth, empleadoGrupoController.obtenerEmpleadosDeGrupo);
router.get('/empleado/:id', auth, empleadoGrupoController.obtenerGruposDeEmpleado);
// Solo Admin
router.post('/',      auth, requireRole(1), empleadoGrupoController.asignarEmpleadoAGrupo);
router.delete('/:id', auth, requireRole(1), empleadoGrupoController.eliminarAsignacion);

module.exports = router; // ✅