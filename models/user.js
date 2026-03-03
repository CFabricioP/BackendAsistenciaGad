// models/users.js
const { DataTypes } = require('sequelize');
const db = require('../config/db');

const User = db.define('User', {
  // PK "id" la crea Sequelize por defecto
  cedula:   { type: DataTypes.STRING, allowNull: false, unique: true },
  nombre:   { type: DataTypes.STRING, allowNull: false },
  apellido: { type: DataTypes.STRING, allowNull: false },
  email:    { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },   // en tu BD puede llamarse "password"
  rol:      { type: DataTypes.ENUM('admin', 'empleado'), allowNull: false },
}, {
  tableName: 'users',      // << importante: tu tabla es "users"
  timestamps: false,       // tienes created_at/updated_at a mano o no los usas
  underscored: true,       // si alguna columna fuera snake_case
  freezeTableName: true,   // evita pluralizaciones raras
});

module.exports = User;
