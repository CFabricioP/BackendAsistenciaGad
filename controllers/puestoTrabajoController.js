
const PuestoTrabajo = require('../models/puestoTrabajoModel');
// GET /api/workplaces
async function listarTodos(_req, res) {
  try {
    const puestos = await PuestoTrabajo.findAll({ order: [['id', 'ASC']] });
    res.json(puestos);
  } catch (e) { res.status(400).json({ error: e.message }); }
}

// GET /api/workplaces/:id
async function obtener(req, res) {
  try {
    const puesto = await PuestoTrabajo.findByPk(req.params.id);
    if (!puesto) return res.status(404).json({ error: 'Puesto no encontrado' });
    res.json(puesto);
  } catch (e) { res.status(400).json({ error: e.message }); }
}

// POST /api/workplaces
async function crear(req, res) {
  try {
    const { nombre, direccion, latitud, longitud, radio_metros = 10, lugar_id } = req.body;
    const puesto = await PuestoTrabajo.create({
      nombre,
      direccion,
      latitud,
      longitud,
      radio_metros,
      lugar_id,
      created_at: new Date()
    });
    res.json(puesto);
  } catch (e) { res.status(400).json({ error: e.message }); }
}

// PUT /api/workplaces/:id
async function actualizar(req, res) {
  try {
    const { nombre, direccion, latitud, longitud, radio_metros, lugar_id } = req.body;
    const puesto = await PuestoTrabajo.findByPk(req.params.id);
    if (!puesto) return res.status(404).json({ error: 'Puesto no encontrado' });
    await puesto.update({ nombre, direccion, latitud, longitud, radio_metros, lugar_id });
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
}

// DELETE /api/workplaces/:id
async function eliminar(req, res) {
  try {
    const puesto = await PuestoTrabajo.findByPk(req.params.id);
    if (!puesto) return res.status(404).json({ error: 'Puesto no encontrado' });
    await puesto.destroy();
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
}

module.exports = { listarTodos, obtener, crear, actualizar, eliminar };