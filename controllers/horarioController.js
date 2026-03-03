// controllers/horarioController.js
const Horario = require('../models/horarioModel');
const EmpleadoHorario = require('../models/empleadoHorarioModel.js');
const Empleado = require('../models/empleadoModel');

// ================= CREAR HORARIO =================
const crearHorario = async (req, res) => {
    try {
        const { nombre, hora_inicio, hora_fin, inicio_almuerzo, fin_almuerzo } = req.body;
        console.log('BODY recibido:', req.body); // 👈 agrega esto

        if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });
        if (!hora_inicio) return res.status(400).json({ error: 'La hora de inicio es requerida' });
        if (!hora_fin) return res.status(400).json({ error: 'La hora de fin es requerida' });

        if ((inicio_almuerzo && !fin_almuerzo) || (!inicio_almuerzo && fin_almuerzo)) {
            return res.status(400).json({ error: 'Debes mandar inicio_almuerzo y fin_almuerzo juntos' });
        }

        console.log('Intentando crear horario...'); // 👈 agrega esto
        const horario = await Horario.create({
            nombre,
            hora_inicio,
            hora_fin,
            inicio_almuerzo: inicio_almuerzo || null,
            fin_almuerzo: fin_almuerzo || null
        });

        res.status(201).json(horario);
    } catch (err) {
        console.error('ERROR COMPLETO:', JSON.stringify(err, null, 2));
        console.error('MENSAJE:', err.message);
        console.error('ORIGINAL:', err.original);
        res.status(500).json({ error: 'Error al crear horario', detalle: err.message });
    }
};
// ================= LISTAR HORARIOS =================
const obtenerHorarios = async (_req, res) => {
    try {
        const horarios = await Horario.findAll({ order: [['id', 'ASC']] });
        res.json(horarios);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener horarios', detalle: err.message });
    }
};

// ================= OBTENER POR ID =================
const obtenerHorarioPorId = async (req, res) => {
    try {
        const horario = await Horario.findByPk(req.params.id);
        if (!horario) return res.status(404).json({ error: 'Horario no encontrado' });
        res.json(horario);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener horario', detalle: err.message });
    }
};

// ================= ACTUALIZAR HORARIO =================
const actualizarHorario = async (req, res) => {
    try {
        const horario = await Horario.findByPk(req.params.id);
        if (!horario) return res.status(404).json({ error: 'Horario no encontrado' });

        const { nombre, hora_inicio, hora_fin, inicio_almuerzo, fin_almuerzo } = req.body;

        if ((inicio_almuerzo && !fin_almuerzo) || (!inicio_almuerzo && fin_almuerzo)) {
            return res.status(400).json({ error: 'Debes mandar inicio_almuerzo y fin_almuerzo juntos' });
        }

        await horario.update({
            nombre: nombre ?? horario.nombre,
            hora_inicio: hora_inicio ?? horario.hora_inicio,
            hora_fin: hora_fin ?? horario.hora_fin,
            inicio_almuerzo: inicio_almuerzo !== undefined ? inicio_almuerzo : horario.inicio_almuerzo,
            fin_almuerzo: fin_almuerzo !== undefined ? fin_almuerzo : horario.fin_almuerzo
        });

        res.json(horario);
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar horario', detalle: err.message });
    }
};

// ================= ELIMINAR HORARIO =================
const eliminarHorario = async (req, res) => {
  try {
    const horario = await Horario.findByPk(req.params.id);
    if (!horario) return res.status(404).json({ error: 'Horario no encontrado' });

    const asignados = await EmpleadoHorario.count({ where: { horario_id: req.params.id } });
    console.log('Empleados asignados:', asignados); // 👈
    
    if (asignados > 0) {
      return res.status(400).json({ 
        error: `No puedes eliminar este horario, tiene ${asignados} empleado(s) asignado(s)` 
      });
    }

    await horario.destroy();
    res.json({ message: 'Horario eliminado correctamente' });
  } catch (err) {
    console.error('ERROR eliminarHorario:', err.message); // 👈
    res.status(500).json({ error: 'Error al eliminar horario', detalle: err.message });
  }
};
// ================= ASIGNAR HORARIO A EMPLEADO =================
const asignarHorario = async (req, res) => {
    try {
        const { empleado_id, horario_id } = req.body;

        if (!empleado_id) return res.status(400).json({ error: 'empleado_id es requerido' });
        if (!horario_id) return res.status(400).json({ error: 'horario_id es requerido' });

        const empleado = await Empleado.findByPk(empleado_id);
        if (!empleado) return res.status(404).json({ error: 'Empleado no encontrado' });

        const horario = await Horario.findByPk(horario_id);
        if (!horario) return res.status(404).json({ error: 'Horario no encontrado' });

        // Si ya tiene horario lo actualiza, si no lo crea
        const [asignacion, creado] = await EmpleadoHorario.findOrCreate({
            where: { empleado_id },
            defaults: { empleado_id, horario_id }
        });

        if (!creado) {
            await asignacion.update({ horario_id });
        }

        res.status(creado ? 201 : 200).json({
            message: creado ? 'Horario asignado correctamente' : 'Horario actualizado correctamente',
            asignacion
        });
    } catch (err) {
        console.error('ERROR asignarHorario:', err.message);
        console.error('DETALLE:', err.original?.message || err);
        res.status(500).json({ error: 'Error al asignar horario', detalle: err.message });
    }
};

// ================= VER HORARIO DE UN EMPLEADO =================
const obtenerHorarioDeEmpleado = async (req, res) => {
    try {
        const { empleado_id } = req.params;

        const asignacion = await EmpleadoHorario.findOne({
            where: { empleado_id },
            include: [{ model: Horario }]
        });

        if (!asignacion) {
            return res.status(404).json({ error: 'Este empleado no tiene horario asignado' });
        }

        res.json(asignacion.Horario);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener horario del empleado', detalle: err.message });
    }
};

// ================= VER MI HORARIO (desde el token) =================
const miHorario = async (req, res) => {
    try {
        const empleado_id = req.user.id;

        const asignacion = await EmpleadoHorario.findOne({
            where: { empleado_id },
            include: [{ model: Horario }]
        });

        if (!asignacion) {
            return res.status(404).json({ error: 'No tienes un horario asignado' });
        }

        const horario = asignacion.Horario;

        res.json({
            ...horario.toJSON(),
            tiene_almuerzo: !!(horario.inicio_almuerzo && horario.fin_almuerzo)
        });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener tu horario', detalle: err.message });
    }
};

module.exports = {
    crearHorario,
    obtenerHorarios,
    obtenerHorarioPorId,
    actualizarHorario,
    eliminarHorario,
    asignarHorario,
    obtenerHorarioDeEmpleado,
    miHorario
};