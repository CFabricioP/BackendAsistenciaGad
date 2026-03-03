const auth        = require('../middleware/auth');
const { requireRole } = require('../middleware/authz');


const { Router } = require('express');
const router = Router();
const ctrl = require('../controllers/cargoController');

router.get('/', auth,ctrl.obtenerCargos);
router.get('/:id', auth, ctrl.obtenerCargoPorId);
router.post('/', auth, requireRole(1), ctrl.crearCargo);
router.put('/:id', auth, requireRole(1), ctrl.actualizarCargo);
router.delete('/:id', auth, requireRole(1), ctrl.eliminarCargo);

module.exports = router;