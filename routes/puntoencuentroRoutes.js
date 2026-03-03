// routes/puntos-encuentro.routes.js
const { Router } = require('express'); const router = Router();
const ctrl = require('../controllers/puntoEncuentroController');
router.post('/', ctrl.crear);
router.get('/', ctrl.listar);
router.put('/:id', ctrl.actualizar);
router.delete('/:id', ctrl.eliminar);
module.exports = router;
