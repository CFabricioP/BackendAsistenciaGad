const cron = require('node-cron');
const { Op } = require('sequelize');
const Asistencia = require('../models/asistenciaModel');
const Horario = require('../models/horarioModel');

const cerrarAsistenciasAbiertas = async () => {
  try {
    console.log('⏰ Ejecutando cierre automático de asistencias...');

    const ahora = new Date();

    // Buscar todas las asistencias diarias sin salida
    const abiertas = await Asistencia.findAll({
      where: {
        hora_salida: null,
        tipo: 'diaria',
        hora_entrada: { [Op.ne]: null }
      }
    });

    let cerradas = 0;

    for (const asistencia of abiertas) {
      // Solo cerrar si tiene horario asignado
      if (!asistencia.horario_id) continue;

      const horario = await Horario.findByPk(asistencia.horario_id);
      if (!horario) continue;

      const [hFin, mFin] = horario.hora_fin.split(':').map(Number);

      // Construir la hora fin del horario en la fecha de la entrada
      const fechaEntrada = new Date(asistencia.hora_entrada);
      const horaFinHorario = new Date(fechaEntrada);
      horaFinHorario.setHours(hFin, mFin, 0, 0);

      // Límite = hora fin + 15 minutos de tolerancia
      const limitecierre = new Date(horaFinHorario.getTime() + 15 * 60 * 1000);

      // Solo cerrar si ya pasó ese límite
      if (ahora < limitecierre) continue;

      await asistencia.update({
        hora_salida: null,        // ✅ Vacía — incompleta
        salida_tardia: false,
        salida_anticipada: false,
        incompleta: true          // ✅ Marcada como incompleta
      });

      cerradas++;
      console.log(`✅ Asistencia ${asistencia.id} marcada como incompleta`);
    }

    console.log(`⏰ Cierre automático finalizado: ${cerradas} asistencia(s) procesadas`);
  } catch (err) {
    console.error('❌ Error en cierre automático:', err.message);
  }
};

// Ejecutar cada 15 minutos
const iniciarJob = () => {
  cron.schedule('*/15 * * * *', cerrarAsistenciasAbiertas);
  console.log('✅ Job de cierre automático iniciado');
  
  // ✅ Ejecutar inmediatamente al arrancar
  cerrarAsistenciasAbiertas();
};

module.exports = { iniciarJob, cerrarAsistenciasAbiertas };