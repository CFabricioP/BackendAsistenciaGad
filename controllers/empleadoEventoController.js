const { Op } = require('sequelize');
const EmpleadoEvento = require('../models/empleadoEventoModel');
const Empleado = require('../models/empleadoModel');
const Evento = require('../models/eventoModel');
const Lugar = require('../models/lugarModel');
const Asistencia = require('../models/asistenciaModel'); // ← agregar

// Asociaciones (si no las tenés en un archivo central, ponelas aquí)
EmpleadoEvento.belongsTo(Empleado, { foreignKey: 'empleado_id' });
EmpleadoEvento.belongsTo(Evento,   { foreignKey: 'evento_id' });

const include = [
  { model: Empleado, attributes: ['id', 'nombre', 'apellido', 'cedula'] },
  { model: Evento,   attributes: ['id', 'titulo', 'fecha'] }
];

// GET /api/asignaciones
async function listarTodas(_req, res) {
  try {
    const asignaciones = await EmpleadoEvento.findAll({ include, order: [['id', 'DESC']] });
    res.json(asignaciones);
  } catch (e) { res.status(400).json({ error: e.message }); }
}

// GET /api/asignaciones/evento/:evento_id
async function listarPorEvento(req, res) {
  try {
    const asignaciones = await EmpleadoEvento.findAll({
      where: { evento_id: req.params.evento_id },
      include,
      order: [['id', 'ASC']]
    });
    res.json(asignaciones);
  } catch (e) { res.status(400).json({ error: e.message }); }
}
 //GET /api/asignaciones/empleado/:empleado_id
async function listarPorEmpleado(req, res) {
  try {
    const empleado_id = req.params.empleado_id;

    const asignaciones = await EmpleadoEvento.findAll({
      where: { empleado_id },
      include: {
        model: Evento,
        attributes: ['titulo', 'fecha', 'hora'],
        include: {
          model: Lugar,
          as: 'lugar',
          attributes: ['nombre', 'latitud', 'longitud']
        }
      },
      order: [['id', 'ASC']],
      raw: true,
      nest: true
    });

    // Buscar todos los eventos donde ya completó asistencia (entrada + salida)
    const asistenciasCompletas = await Asistencia.findAll({
      where: {
        empleado_id,
        tipo: 'evento',
        hora_salida: { [Op.ne]: null } // tiene salida = completado
      },
      attributes: ['eventos_id']
    });

    // Array de evento_ids ya completados
    const eventosCompletados = asistenciasCompletas.map(a => a.eventos_id);

    // Filtrar eventos pendientes
    const resultado = asignaciones
      .filter(a => !eventosCompletados.includes(a.evento_id))
      .map(a => ({
        emplado_evento_id: a.id,
        empleado_id: a.empleado_id,
        evento_id: a.evento_id,
        titulo: a.evento.titulo,
        fecha: a.evento.fecha,
        hora: a.evento.hora,
        lugar: a.evento.lugar.nombre,
        latitud: a.evento.lugar.latitud,
        longitud: a.evento.lugar.longitud
      }));

    res.json(resultado);
  } catch (e) { res.status(400).json({ error: e.message }); }
}
// GET /api/asignaciones/:id
async function obtener(req, res) {
  try {
    const asignacion = await EmpleadoEvento.findByPk(req.params.id, { include });
    if (!asignacion) return res.status(404).json({ error: 'Asignación no encontrada' });
    res.json(asignacion);
  } catch (e) { res.status(400).json({ error: e.message }); }
}

// POST /api/asignaciones
async function crear(req, res) {
  try {
    const { empleado_id, evento_id } = req.body;
    // Validar existencia de empleado y evento
    const emp = await Empleado.findByPk(empleado_id);
    if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });
    const evt = await Evento.findByPk(evento_id);
    if (!evt) return res.status(404).json({ error: 'Evento no encontrado' });
    //Validar que el empleado no esté ya asignado al evento
    const existente = await EmpleadoEvento.findOne({ where: { empleado_id, evento_id } });
    if (existente) return res.status(400).json({ error: 'Empleado ya asignado a este evento' });
    const asignacion = await EmpleadoEvento.create({ empleado_id, evento_id });
    res.json(asignacion);
  } catch (e) { res.status(400).json({ error: e.message }); }
}

// DELETE /api/asignaciones/:id
async function eliminar(req, res) {
  try {
    const asignacion = await EmpleadoEvento.findByPk(req.params.id);
    if (!asignacion) return res.status(404).json({ error: 'Asignación no encontrada' });
    await asignacion.destroy();
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
}

module.exports = { listarTodas, listarPorEvento, listarPorEmpleado, obtener, crear, eliminar };