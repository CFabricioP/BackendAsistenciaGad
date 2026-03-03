const Lugar = require('../models/lugarModel');

// Helper mínimo para sanear el radio
function normalizarRadio(valor) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return 10;   // por defecto
  if (n < 1) return 10;                 // mínimo 1 (mantén tu criterio)
  return Math.floor(n);                 // entero
}

// Obtener todos los lugares (para mostrar en el mapa o lista)
exports.obtenerLugares = async (req, res) => {
  try {
    const lugares = await Lugar.findAll();
    res.json(lugares);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los lugares' });
  }
};

// Crear un nuevo lugar (requiere nombre, ubicación, latitud y longitud)
exports.crearLugar = async (req, res) => {
  try {
    let { nombre, direccion, latitud, longitud, radio } = req.body;

    // Validación simple (radio NO bloquea la creación; se normaliza)
    if (!nombre || !direccion || !latitud || !longitud) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const nuevo = await Lugar.create({
      nombre,
      direccion,
      latitud,
      longitud,
      radio: normalizarRadio(radio) // <- saneo y default
    });

    res.status(201).json(nuevo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Actualizar un lugar existente por ID
exports.actualizarLugar = async (req, res) => {
  const { id } = req.params;
  try {
    const lugar = await Lugar.findByPk(id);
    if (!lugar) {
      return res.status(404).json({ error: 'Lugar no encontrado' });
    }

    let { nombre, direccion, latitud, longitud, radio } = req.body;

    const updates = {};
    if (nombre)    updates.nombre    = nombre;
    if (direccion) updates.direccion = direccion;
    if (latitud)   updates.latitud   = latitud;
    if (longitud)  updates.longitud  = longitud;
    if (radio !== undefined) updates.radio = normalizarRadio(radio);

    await lugar.update(updates);
    res.json(lugar);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Eliminar un lugar por ID
exports.eliminarLugar = async (req, res) => {
  const { id } = req.params;
  try {
    const lugar = await Lugar.findByPk(id);
    if (!lugar) {
      return res.status(404).json({ error: 'Lugar no encontrado' });
    }
    await lugar.destroy();
    res.json({ mensaje: 'Lugar eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
