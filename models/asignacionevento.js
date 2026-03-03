// Backend/models/asignacionEvento.js
const { DataTypes } = require('sequelize');
const db = require('../config/db');

const AsignacionEvento = db.define('asignaciones_evento', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  evento_id: DataTypes.INTEGER,
  empleado_id: DataTypes.INTEGER,
  puesto_evento_id: DataTypes.INTEGER
}, { tableName: 'asignaciones_evento', timestamps: true });

module.exports = AsignacionEvento;
