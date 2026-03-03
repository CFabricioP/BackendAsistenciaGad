const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Asistencia = db.define('asistencia', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  empleado_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tipo: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['diaria', 'evento']]
    }
  },
  empleado_evento_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  eventos_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  hora_entrada: {
    type: DataTypes.DATE,
    allowNull: true
  },
  hora_salida: {
    type: DataTypes.DATE,
    allowNull: true
  },
  horario_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  salida_almuerzo: {
    type: DataTypes.DATE,
    allowNull: true
  },
  regreso_almuerzo: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // ✅ NUEVOS
  tardanza: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  salida_anticipada: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  motivo_salida_anticipada: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  salida_tardia: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  incompleta: {
  type: DataTypes.BOOLEAN,
  defaultValue: false
},
  // ✅ NUEVOS
  latitud_registro: {
    type: DataTypes.STRING,
    allowNull: true
  },
  longitud_registro: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'asistencia',
  timestamps: false,
  freezeTableName: true
});

module.exports = Asistencia;