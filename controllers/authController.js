const jwt = require('jsonwebtoken');
const Empleado = require('../models/empleadoModel');
const Rol = require('../models/rolModel');
const Cargo = require('../models/cargoModel');
const bcrypt = require('bcryptjs');

const login = async (req, res) => {
  try {
    const { cedula, password } = req.body;

    const empleado = await Empleado.scope('withSecret').findOne({
      where: { cedula },
      include: [
        { model: Rol, as: 'rol' },
        { model: Cargo, as: 'cargo' }
      ]
    });

    if (!empleado) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const passwordOK = await empleado.validatePassword(password);
    if (!passwordOK) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: empleado.id, rol_id: empleado.rol_id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );

    res.json({
      mensaje: 'Login exitoso',
      token,
      rol: empleado.rol?.descripcion, // el frontend redirige según esto
      empleado: {
        id: empleado.id,
        cedula: empleado.cedula,
        nombre: empleado.nombre,
        apellido: empleado.apellido,
        rol: empleado.rol?.descripcion,
        cargo: empleado.cargo?.descripcion,
        lugar_id: empleado.lugar_id
      }
    });

  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  login
};