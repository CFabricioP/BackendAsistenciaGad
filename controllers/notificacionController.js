// controllers/notificacionesController.js
const { Op } = require('sequelize');
const Empleado = require('../models/empleadoModel.js');
const Notificacion = require('../models/notificacionModel.js');
const NotificacionDetalle = require('../models/notificacionEmpleadoModel.js');

const { sendFCMToTokens } = require('../services/fcm.js');

function chunk(arr, size = 900) {
  const out = []; for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size)); return out;
}
const uniq = arr => [...new Set(arr.filter(Boolean))];

async function guardarToken(req, res) {
  try {
    const { id } = req.params;
    const { device_token } = req.body;
    if (!device_token) return res.status(400).json({ error: 'Falta device_token' });
    const emp = await Empleado.findByPk(id);
    if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });
    emp.device_token = device_token; await emp.save();
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
}

async function borrarToken(req, res) {
  try {
    const { id } = req.params;
    const emp = await Empleado.findByPk(id);
    if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });
    emp.device_token = null; await emp.save();
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
}

async function enviarNotificaciones(req, res) {
  try {
    const { titulo, cuerpo, empleadosIds = [] } = req.body;
    if (!titulo || !cuerpo) return res.status(400).json({ error: 'Falta titulo/cuerpo' });
    if (!empleadosIds.length) return res.status(400).json({ error: 'Sin empleadosIds' });

    const emps = await Empleado.findAll({ where: { id: { [Op.in]: empleadosIds } } });
    const tokens = uniq(emps.map(e => e.device_token));
    if (!tokens.length) return res.status(400).json({ error: 'Sin tokens válidos' });

    const notif = await Notificacion.create({
      titulo, mensaje: cuerpo,
      fecha_envio: new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Guayaquil' }))
    });
    console.log('🔔 Notificación creada:', notif); // 👈 agrega este log para verificar creación de notificación

    const batches = chunk(tokens);
    const results = [];
    for (const tks of batches) {
      const result = await sendFCMToTokens(tks, { titulo, cuerpo });
      results.push(result);
      for (const emp of emps) {
        if (!emp.device_token) continue;
        const fallo = result?.failedTokens?.includes(emp.device_token);
        await NotificacionDetalle.create({
          notificacion_id: notif.id,
          empleado_id: emp.id,
          estado: fallo ? 'fallido' : 'enviado',
        });
      }
    }
    res.json({ ok: true, batches: batches.length, results });
  } catch (e) { res.status(400).json({ error: e.message }); }
}

async function enviarBroadcast(req, res) {
  try {
    const { titulo, cuerpo } = req.body;
    if (!titulo || !cuerpo) return res.status(400).json({ error: 'Falta titulo/cuerpo' });

    const emps = await Empleado.findAll({ where: { device_token: { [Op.ne]: null } } });
    const tokens = uniq(emps.map(e => e.device_token));
    if (!tokens.length) return res.status(400).json({ error: 'No hay tokens registrados' });

    const notif = await Notificacion.create({
      titulo, mensaje: cuerpo,
      fecha_envio: new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Guayaquil' }))
    });

    const batches = chunk(tokens);
    const results = [];
    for (const tks of batches) {
      const result = await sendFCMToTokens(tks, { titulo, cuerpo });
      results.push(result);
      for (const emp of emps) {
        if (!emp.device_token) continue;
        const fallo = result?.failedTokens?.includes(emp.device_token);
        await NotificacionDetalle.create({
          notificacion_id: notif.id,
          empleado_id: emp.id,
          estado: fallo ? 'fallido' : 'enviado'
        });
      }
    }
    res.json({ ok: true, totalTokens: tokens.length, batches: batches.length, results });
  } catch (e) { res.status(400).json({ error: e.message }); }
}

async function enviarTestAEmpleado(req, res) {
  try {
    const { id } = req.params;
    const { titulo = 'Prueba', cuerpo = 'Test de notificación' } = req.body;
    const emp = await Empleado.findByPk(id);
    if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });
    if (!emp.device_token) return res.status(400).json({ error: 'Empleado sin device_token' });
    const result = await sendFCMToTokens([emp.device_token], { titulo, cuerpo });
    res.json({ ok: true, result });
  } catch (e) { res.status(400).json({ error: e.message }); }
}

async function tokensStats(_req, res) {
  try {
    const total = await Empleado.count();
    const conToken = await Empleado.count({ where: { device_token: { [Op.ne]: null } } });
    res.json({ totalEmpleados: total, conToken, sinToken: total - conToken });
  } catch (e) { res.status(400).json({ error: e.message }); }
}

async function listarNotificaciones(req, res) {
  try {
    const notificaciones = await Notificacion.findAll({
      include: [{
        model: NotificacionDetalle,
        as: 'detalles',
        include: [{ model: Empleado, as: 'empleado', attributes: ['id', 'nombre', 'apellido'] }]
      }]
    });
    res.json(notificaciones);
  } catch (e) { res.status(400).json({ error: e.message }); }
}
// Obtener notificaciones de un empleado específico
async function obtenerNotificacionesEmpleado(req, res) {
  try {
    const { id } = req.params;

    const detalles = await NotificacionDetalle.findAll({
      where: {
        empleado_id: id,
        estado: { [Op.ne]: 'archivado' }
      }, // Excluir archivados
      include: [{
        model: Notificacion,
        as: 'notificacion',
        attributes: ['id', 'titulo', 'mensaje', 'fecha_envio']
      }],
      order: [[{ model: Notificacion, as: 'notificacion' }, 'fecha_envio', 'DESC']],
      limit: 30 // Limitar a las 30 notificaciones más recientes
    });

    res.json(detalles);
  } catch (e) { res.status(400).json({ error: e.message }); }
}
// Marcar notificación como recibida
async function marcarComoRecibida(req, res) {
  try {
    const { empleado_id, notificacion_id } = req.params;

    const detalle = await NotificacionDetalle.findOne({
      where: { empleado_id, notificacion_id }
    });

    if (!detalle) return res.status(404).json({ error: 'Notificación no encontrada' });

    detalle.estado = 'recibido';
    await detalle.save();

    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
}
// Archivar notificación (swipe)
async function archivarNotificacion(req, res) {
  try {
    const { empleado_id, notificacion_id } = req.params;
    console.log('🔔 Archivar:', empleado_id, notificacion_id); // 👈 agrega

    const detalle = await NotificacionDetalle.findOne({
      where: { empleado_id, notificacion_id }
    });
    console.log('🔔 Detalle encontrado:', detalle); // 👈 agrega

    if (!detalle) return res.status(404).json({ error: 'Notificación no encontrada' });

    detalle.estado = 'archivado';
    await detalle.save();

    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
}
//Contar notificaciones registradas
async function contarNotificaciones(req, res) {
  try {
    const total = await Notificacion.count();
    res.json({ totalNotificaciones: total });
  } catch (e) { res.status(400).json({ error: e.message }); }
}
module.exports = {
  guardarToken, borrarToken,
  enviarNotificaciones, enviarBroadcast, enviarTestAEmpleado,
  tokensStats, listarNotificaciones, obtenerNotificacionesEmpleado, marcarComoRecibida, archivarNotificacion, contarNotificaciones
};