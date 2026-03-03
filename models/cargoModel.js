const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Cargo = db.define('Cargo', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  descripcion: {
    type: DataTypes.STRING(255),
    allowNull: false
  }
}, {
  tableName: 'cargos',
  timestamps: false
});

module.exports = Cargo;