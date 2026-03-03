const { DataTypes } = require('sequelize');
const db = require('../config/db');
const EmpleadoGrupo = db.define('EmpleadoGrupo', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    grupo_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    empleado_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'empleado_grupos',
    timestamps: false,
    freezeTableName: true
});
module.exports = EmpleadoGrupo;