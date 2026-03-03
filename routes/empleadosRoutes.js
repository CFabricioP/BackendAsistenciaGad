const express = require('express');
const router = express.Router();
const empleadoController = require('../controllers/empleadoController');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/authz');

// ✅ Pública — sin middleware
router.post('/login-empleado', authController.login);

// ✅ Solo autenticado
router.get('/',    auth, empleadoController.obtenerEmpleados);
router.get('/:id', auth, empleadoController.obtenerEmpleadoPorId);

// ✅ Solo Admin
router.post('/',      auth, requireRole(1), empleadoController.crearEmpleado);
router.put('/:id',    auth, requireRole(1), empleadoController.actualizarEmpleado);
router.delete('/:id', auth, requireRole(1), empleadoController.eliminarEmpleado);

module.exports = router;