const { DataTypes } = require('sequelize');
const db = require('../config/db');
const Grupo = db.define('grupo', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    estado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'grupos',
    timestamps: false,
    freezeTableName: true
});
module.exports = Grupo;