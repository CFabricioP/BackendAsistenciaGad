const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Horario = db.define('Horario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false  // "Turno Mañana", "Turno Tarde", "Turno Completo"
    },
    hora_inicio: {
        type: DataTypes.TIME,
        allowNull: false
    },
    hora_fin: {
        type: DataTypes.TIME,
        allowNull: false
    },
    // 👇 NUEVO
    inicio_almuerzo: {
        type: DataTypes.TIME,
        allowNull: true   // null = no tiene almuerzo
    },
    fin_almuerzo: {
        type: DataTypes.TIME,
        allowNull: true
    }
    // 👆 NUEVO
}, {
    tableName: 'horarios',
    timestamps: false,
    freezeTableName: true
});

module.exports = Horario;