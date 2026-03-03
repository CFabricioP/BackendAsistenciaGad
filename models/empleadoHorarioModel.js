const { DataTypes } = require('sequelize');
const db = require('../config/db');
const EmpleadoHorario = db.define('EmpleadoHorario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    empleado_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    horario_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'empleado_horario',
    timestamps: false,
    freezeTableName: true
});
module.exports = EmpleadoHorario;
