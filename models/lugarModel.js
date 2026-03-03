// models/lugares.js
const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Lugar = db.define('Lugar', {
  id:         { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre:     { type: DataTypes.STRING, allowNull: false, unique: true },
  direccion:  { type: DataTypes.STRING, allowNull: false },
  latitud:    { type: DataTypes.STRING, allowNull: false },
  longitud:   { type: DataTypes.STRING, allowNull: false },
  radio:      { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 }
}, {
  tableName: 'lugares',
  timestamps: false,
  freezeTableName: true
});

Lugar.prototype.getUbicacionCompleta = function () {
  return `${this.nombre} - ${this.direccion} [${this.latitud}, ${this.longitud}]`;
};

module.exports = Lugar;