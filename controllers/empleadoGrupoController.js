const EmpleadoGrupo = require('../models/empleadoGrupoModel');
const Grupo         = require('../models/grupoModel');
const Empleado      = require('../models/empleadoModel');
require('../models/assosations');

// ── Asignar empleado a grupo ──
const asignarEmpleadoAGrupo = async (req, res) => {
    try {
        const { empleado_id, grupo_id } = req.body;
        if (!empleado_id) return res.status(400).json({ error: 'empleado_id es requerido' });
        if (!grupo_id)    return res.status(400).json({ error: 'grupo_id es requerido' });

        const empleado = await Empleado.findByPk(empleado_id);
        if (!empleado) return res.status(404).json({ error: 'Empleado no encontrado' });

        const grupo = await Grupo.findByPk(grupo_id);
        if (!grupo) return res.status(404).json({ error: 'Grupo no encontrado' });

        const existente = await EmpleadoGrupo.findOne({ where: { empleado_id, grupo_id } });
        if (existente) return res.status(400).json({ error: 'Empleado ya asignado a este grupo' });

        const asignacion = await EmpleadoGrupo.create({ empleado_id, grupo_id });
        res.status(201).json(asignacion);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── Obtener empleados de un grupo (con datos completos) ──
const obtenerEmpleadosDeGrupo = async (req, res) => {
    try {
        const asignaciones = await EmpleadoGrupo.findAll({
            where: { grupo_id: req.params.id }
        });

        const resultado = await Promise.all(
            asignaciones.map(async (a) => {
                const empleado = await Empleado.findByPk(a.empleado_id, {
                    attributes: ['id', 'nombre', 'apellido', 'cedula','device_token']
                });
                const grupo = await Grupo.findByPk(a.grupo_id, {
                    attributes: ['id', 'nombre']
                });
                return {
                    id:          a.id,
                    empleado_id: a.empleado_id,
                    grupo_id:    a.grupo_id,
                    empleado,
                    grupo
                };
            })
        );

        res.json(resultado);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── Obtener grupos de un empleado ──
const obtenerGruposDeEmpleado = async (req, res) => {
    try {
        const asignaciones = await EmpleadoGrupo.findAll({
            where: { empleado_id: req.params.id },
            include: [
                { model: Grupo,    attributes: ['id', 'nombre'] },
                { model: Empleado, attributes: ['id', 'nombre', 'apellido'] }
            ]
        });

        const resultado = asignaciones.map(a => ({
            id:          a.id,
            empleado_id: a.empleado_id,
            grupo_id:    a.grupo_id,
            empleado:    a.Empleado,
            grupo:       a.Grupo
        }));

        res.json(resultado);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── Eliminar asignación por id ──
const eliminarAsignacion = async (req, res) => {
    try {
        const asignacion = await EmpleadoGrupo.findByPk(req.params.id);
        if (!asignacion) return res.status(404).json({ error: 'Asignación no encontrada' });
        await asignacion.destroy();
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    asignarEmpleadoAGrupo,
    obtenerEmpleadosDeGrupo,
    obtenerGruposDeEmpleado,
    eliminarAsignacion
};