const Cargo  = require('../models/cargoModel');

// ================= CREAR =================
const crearCargo = async (req, res) => {
  try {
    const { descripcion } = req.body;

    const cargo = await Cargo.create({ descripcion });

    res.status(201).json(cargo);
  } catch (err) {
    res.status(500).json({
      error: 'Error al crear cargo',
      detalle: err.message
    });
  }
};

// ================= LISTAR =================
const obtenerCargos = async (_req, res) => {
  try {
    const cargos = await Cargo.findAll();
    res.json(cargos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener cargos' });
  }
};

// ================= OBTENER POR ID =================
const obtenerCargoPorId = async (req, res) => {
  try {
    const cargo = await Cargo.findByPk(req.params.id);

    if (!cargo) {
      return res.status(404).json({ error: 'Cargo no encontrado' });
    }

    res.json(cargo);
  } catch (err) {
    res.status(500).json({ error: 'Error al buscar cargo' });
  }
};

// ================= ACTUALIZAR =================
const actualizarCargo = async (req, res) => {
  try {
    const cargo = await Cargo.findByPk(req.params.id);

    if (!cargo) {
      return res.status(404).json({ error: 'Cargo no encontrado' });
    }

    const { descripcion } = req.body;

    await cargo.update({ descripcion });

    res.json({ message: 'Cargo actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar cargo' });
  }
};

// ================= ELIMINAR =================
const eliminarCargo = async (req, res) => {
  try {
    const cargo = await Cargo.findByPk(req.params.id);

    if (!cargo) {
      return res.status(404).json({ error: 'Cargo no encontrado' });
    }

    await cargo.destroy();

    res.json({ message: 'Cargo eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar cargo' });
  }
};

module.exports = {
  crearCargo,
  obtenerCargos,
  obtenerCargoPorId,
  actualizarCargo,
  eliminarCargo
};