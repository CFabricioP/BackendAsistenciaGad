// models/empleadoModel.js
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const db = require('../config/db');


const Empleado = db.define('empleado', {
  id:            { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  cedula:        { type: DataTypes.STRING, allowNull: false, unique: true },
  nombre:        { type: DataTypes.STRING, allowNull: false },
  apellido:      { type: DataTypes.STRING, allowNull: false },
  email:         { type: DataTypes.STRING, allowNull: true },
  password_hash: { type: DataTypes.STRING, allowNull: true, field: 'password_hash' },
  rol_id:        { type: DataTypes.INTEGER, allowNull: true },
  cargo_id:      { type: DataTypes.INTEGER, allowNull: true },
  device_token:  { type: DataTypes.TEXT, allowNull: true, field: 'device_token' },
  create_at:     { type: DataTypes.DATE, allowNull: true, field: 'create_at' },
  lugar_id: {
  type: DataTypes.INTEGER,
  allowNull: true
}
}, {
  tableName: 'empleados',
  timestamps: false,
  underscored: true,
  freezeTableName: true,
  defaultScope: {
    attributes: { exclude: ['password_hash'] }
  },
  scopes: {
    withSecret: { attributes: { include: ['password_hash'] } }
  }
});

Empleado.prototype.setPassword = async function (plain) {
  const salt = await bcrypt.genSalt(10);
  this.password_hash = await bcrypt.hash(String(plain || ''), salt);
};
Empleado.prototype.validatePassword = function (plain) {
  const hash = this.getDataValue('password_hash') || '';
  return bcrypt.compare(String(plain || ''), hash);
};

const Rol = require('./rolModel');
const Cargo = require('./cargoModel');

Empleado.belongsTo(Rol, { foreignKey: 'rol_id', as: 'rol' });
Empleado.belongsTo(Cargo, { foreignKey: 'cargo_id', as: 'cargo' });
// al final del empleadoModel.js, antes del module.exports
Empleado.belongsTo(require('./lugarModel'), { foreignKey: 'lugar_id', as: 'lugar' });
module.exports = Empleado;