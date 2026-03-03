const express = require('express');
const router = express.Router();
const grupoController = require('../controllers/grupoController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/authz');
// Solo autenticado
router.get('/',    auth, grupoController.obtenerGrupos);
router.get('/:id', auth, grupoController.obtenerGrupoPorId);
// Solo Admin
router.post('/',      auth, requireRole(1), grupoController.crearGrupo);
router.put('/:id',    auth, requireRole(1), grupoController.actualizarGrupo);
router.delete('/:id', auth, requireRole(1), grupoController.eliminarGrupo);
router.patch('/:id/toggle', auth, requireRole(1), grupoController.toggleEstadoGrupo);

module.exports = router;
