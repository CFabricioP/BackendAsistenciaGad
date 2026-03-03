const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Notificacion = db.define('notificacion', {
  id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  titulo:      { type: DataTypes.STRING, allowNull: false },
  mensaje:     { type: DataTypes.TEXT, allowNull: false },
  fecha_envio: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: 'notificaciones',
  timestamps: false,
  underscored: true,
  freezeTableName: true,
});

module.exports = Notificacion;