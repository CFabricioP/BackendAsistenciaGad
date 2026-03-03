// routes/empleadoEventoRoutes.js
const { Router } = require('express');
const router = Router();
const ctrl = require('../controllers/empleadoEventoController');
// Solo autenticado
const auth = require('../middleware/auth');
// 📌 CRUD
router.get('/', auth, ctrl.listarTodas);
router.get('/empleado/:empleado_id', auth, ctrl.listarPorEmpleado);
router.get('/evento/:evento_id', auth, ctrl.listarPorEvento);
router.get('/:id', auth, ctrl.obtener);
router.post('/', auth, ctrl.crear);
router.delete('/:id', auth, ctrl.eliminar);

module.exports = router;