const Rol  = require('../models/rolModel');

// ================= CREAR =================
const crearRol = async (req, res) => {
  try {
    const { descripcion } = req.body;

    const rol = await Rol.create({ descripcion });

    res.status(201).json(rol);
  } catch (err) {
    res.status(500).json({
      error: 'Error al crear rol',
      detalle: err.message
    });
  }
};

// ================= LISTAR =================
const obtenerRoles = async (_req, res) => {
  try {
    const roles = await Rol.findAll();
    console.log('Roles obtenidos:', roles); // Debug: mostrar roles en consola
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener roles' });
  }
};

// ================= OBTENER POR ID =================
const obtenerRolPorId = async (req, res) => {
  try {
    const rol = await Rol.findByPk(req.params.id);

    if (!rol) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    res.json(rol);
  } catch (err) {
    res.status(500).json({ error: 'Error al buscar rol' });
  }
};

// ================= ACTUALIZAR =================
const actualizarRol = async (req, res) => {
  try {
    const rol = await Rol.findByPk(req.params.id);

    if (!rol) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    const { descripcion } = req.body;

    await rol.update({ descripcion });

    res.json({ message: 'Rol actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar rol' });
  }
};

// ================= ELIMINAR =================
const eliminarRol = async (req, res) => {
  try {
    const rol = await Rol.findByPk(req.params.id);

    if (!rol) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    await rol.destroy();

    res.json({ message: 'Rol eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar rol' });
  }
};

module.exports = {
  crearRol,
  obtenerRoles,
  obtenerRolPorId,
  actualizarRol,
  eliminarRol
};