const { Router } = require('express');
const router = Router();
const ctrl = require('../controllers/notificacionController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/authz');


router.get('/empleados/:id', auth, ctrl.obtenerNotificacionesEmpleado);
router.patch('/empleados/:empleado_id/notificaciones/:notificacion_id/recibida', auth, ctrl.marcarComoRecibida);
router.patch('/empleados/:empleado_id/notificaciones/:notificacion_id/archivar', auth, ctrl.archivarNotificacion);
// Empleado registra/borra su propio token
router.patch('/empleados/:id/device-token', ctrl.guardarToken);
router.delete('/empleados/:id/device-token', auth, ctrl.borrarToken);

// Solo Admin puede enviar
router.post('/',          auth, requireRole(1), ctrl.enviarNotificaciones);
router.post('/broadcast', auth, requireRole(1), ctrl.enviarBroadcast);

// Solo autenticado
router.get('/tokens/stats', auth, ctrl.tokensStats);
router.get('/listado',      auth, ctrl.listarNotificaciones);
// Contar total de notificaciones
router.get('/count',        auth, ctrl.contarNotificaciones);
module.exports = router;