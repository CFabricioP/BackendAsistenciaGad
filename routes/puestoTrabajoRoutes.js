const { Router } = require('express');
const router = Router();
const ctrl = require('../controllers/puestoTrabajoController');

router.get('/',      ctrl.listarTodos);
router.get('/:id',   ctrl.obtener);
router.post('/',     ctrl.crear);
router.put('/:id',   ctrl.actualizar);
router.delete('/:id', ctrl.eliminar);

module.exports = router;