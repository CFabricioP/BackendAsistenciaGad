const { DataTypes } = require('sequelize');
const db = require('../config/db');

const NotificacionEmpleado = db.define('notificacion_empleado', {
  id:              { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  empleado_id:     { type: DataTypes.INTEGER, allowNull: false },
  notificacion_id: { type: DataTypes.INTEGER, allowNull: false },
  estado:          { type: DataTypes.STRING, allowNull: false },
}, {
  tableName: 'notificacion_empleado',
  timestamps: false,
  freezeTableName: true
});

module.exports = NotificacionEmpleado;