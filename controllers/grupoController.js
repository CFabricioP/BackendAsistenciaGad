const  Grupo= require('../models/grupoModel');

const crearGrupo = async (req, res) => {
    try {

        const { nombre, descripcion } = req.body;
        if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });
        const grupo = await Grupo.create({ nombre, descripcion });
        console.log('Grupo creado:', grupo); // 👈 agrega esto
        res.status(201).json(grupo);
    } catch (err) {
        res.status(500).json({ error: 'Error al crear grupo', detalle: err.message });
    }
};

const obtenerGrupos = async (_req, res) => {
    try {
        const grupos = await Grupo.findAll();
        res.json(grupos);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener grupos', detalle: err.message });
    }
};
//Obtener grupo por ID
const obtenerGrupoPorId = async (req, res) => {
    try {        const grupo = await Grupo.findByPk(req.params.id);
        if (!grupo) return res.status(404).json({ error: 'Grupo no encontrado' });
        res.json(grupo);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener grupo', detalle: err.message });
    }
};

const actualizarGrupo = async (req, res) => {
    try {
        const grupo = await Grupo.findByPk(req.params.id);
        if (!grupo) return res.status(404).json({ error: 'Grupo no encontrado' });
        const { nombre, descripcion, estado } = req.body;
        await grupo.update({ nombre, descripcion, estado });
        res.json({ message: 'Grupo actualizado correctamente' });
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar grupo', detalle: err.message });
    }
};

const eliminarGrupo = async (req, res) => {
    try {
        const grupo = await Grupo.findByPk(req.params.id);
        if (!grupo) return res.status(404).json({ error: 'Grupo no encontrado' });
        await grupo.destroy();
        res.json({ message: 'Grupo eliminado correctamente' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar grupo', detalle: err.message });
    }
};

//toggle estado
const toggleEstadoGrupo = async (req, res) => {
    try {        const grupo = await Grupo.findByPk(req.params.id);
        if (!grupo) return res.status(404).json({ error: 'Grupo no encontrado' });
        await grupo.update({ estado: !grupo.estado });
        res.json({ message: `Grupo ${grupo.estado ? 'activado' : 'desactivado'} correctamente` });
    } catch (err) {
        res.status(500).json({ error: 'Error al cambiar estado del grupo', detalle: err.message });
    }
};

module.exports = {
    crearGrupo,
    obtenerGrupos,
    obtenerGrupoPorId,
    actualizarGrupo,
    eliminarGrupo,
    toggleEstadoGrupo
};