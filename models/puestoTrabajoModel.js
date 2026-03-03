// Backend/models/puestoEvento.js
const { DataTypes } = require('sequelize');
const db = require('../config/db');

const PuestoTrabajo = db.define('puesto', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING(100) },
  direccion: { type: DataTypes.TEXT },
  latitud: { type: DataTypes.DOUBLE },
  longitud: { type: DataTypes.DOUBLE },
  radio_metros: { type: DataTypes.INTEGER },
  lugar_id: { type: DataTypes.INTEGER },
  created_at: { type: DataTypes.DATE },
}, {
  tableName: 'workplaces',
  timestamps: false,
  freezeTableName: true
});
module.exports = PuestoTrabajo;
