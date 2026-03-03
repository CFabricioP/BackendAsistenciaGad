const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Evento = db.define('evento', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  titulo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false
  },
  hora: {
    type: DataTypes.TIME,
    allowNull: false
  },
  lugar_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'eventos',
  timestamps: false,
  freezeTableName: true
});

module.exports = Evento;