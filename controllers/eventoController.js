const Evento = require('../models/eventoModel');
const Lugar = require('../models/lugarModel');
// ================= ASOCIACIONES =================
Evento.belongsTo(Lugar, { foreignKey: 'lugar_id', as: 'lugar' });
// ================= CREAR =================
const crearEvento = async (req, res) => {
  try {
    const { titulo, descripcion, fecha, hora, lugar_id } = req.body;

    // Validar que la fecha no sea anterior a hoy
    if (fecha) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fechaEvento = new Date(fecha);
      if (fechaEvento < hoy) {
        return res.status(400).json({ error: 'No se pueden crear eventos en fechas pasadas.' });
      }
    }

    const evento = await Evento.create({ titulo, descripcion, fecha, hora, lugar_id });
    res.status(201).json(evento);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear evento', detalle: err.message });
  }
};

const actualizarEvento = async (req, res) => {
  try {
    const evento = await Evento.findByPk(req.params.id);
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });

    const { titulo, descripcion, fecha, hora, lugar_id } = req.body;

    // Validar que la fecha no sea anterior a hoy
    if (fecha) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fechaEvento = new Date(fecha);
      if (fechaEvento < hoy) {
        return res.status(400).json({ error: 'No se pueden asignar fechas pasadas al evento.' });
      }
    }

    await evento.update({ titulo, descripcion, fecha, hora, lugar_id });
    res.json({ message: 'Evento actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar evento' });
  }
};

// ================= LISTAR =================
const obtenerEventos = async (_req, res) => {
  try {
    const eventos = await Evento.findAll();
    res.json(eventos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
};


// ================= OBTENER POR ID =================
const obtenerEventoPorId = async (req, res) => {
  try {
    const evento = await Evento.findByPk(req.params.id);

    if (!evento) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    res.json(evento);
  } catch (err) {
    res.status(500).json({ error: 'Error al buscar evento' });
  }
};


// ================= ELIMINAR =================
const eliminarEvento = async (req, res) => {
  try {
    const evento = await Evento.findByPk(req.params.id);

    if (!evento) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    await evento.destroy();

    res.json({ message: 'Evento eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar evento' });
  }
};


module.exports = {
  crearEvento,
  obtenerEventos,
  obtenerEventoPorId,
  actualizarEvento,
  eliminarEvento
};