const { Router } = require('express');
const router = Router();
const ctrl = require('../controllers/rolController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/authz');

// Solo autenticado — cualquiera necesita consultar roles
router.get('/',    auth, ctrl.obtenerRoles);
router.get('/:id', auth, ctrl.obtenerRolPorId);

// Solo Admin
router.post('/',      auth, requireRole(1), ctrl.crearRol);
router.put('/:id',    auth, requireRole(1), ctrl.actualizarRol);
router.delete('/:id', auth, requireRole(1), ctrl.eliminarRol);

module.exports = router;