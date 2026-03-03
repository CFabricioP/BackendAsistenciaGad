//Crear modelo para la tabla intermedia empleado_evento
const { DataTypes } = require('sequelize');
const db = require('../config/db');
const EmpleadoEvento = db.define('EmpleadoEvento', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  empleado_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  evento_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
    tableName: 'empleado_eventos',
    timestamps: false,
    freezeTableName: true
});

module.exports = EmpleadoEvento;