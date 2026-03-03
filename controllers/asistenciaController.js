const { Op } = require('sequelize');
const Asistencia = require('../models/asistenciaModel');
const Lugar = require('../models/lugarModel');
const Evento = require('../models/eventoModel');
const Empleado = require('../models/empleadoModel');
const EmpleadoHorario = require('../models/empleadoHorarioModel');
const Horario = require('../models/horarioModel');

// ================= HELPERS =================
const calcularDistancia = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const obtenerLugar = async (tipo, body, empleado_id) => {
  if (tipo === 'evento') {
    const evento = await Evento.findByPk(body.eventos_id);
    if (!evento) return { error: 'Evento no encontrado' };
    if (!evento.lugar_id) return { error: 'El evento no tiene un lugar asignado' };
    const lugar = await Lugar.findByPk(evento.lugar_id);
    if (!lugar) return { error: 'Lugar del evento no encontrado' };
    return { lugar };
  }
  if (tipo === 'diaria') {
    const empleado = await Empleado.findByPk(empleado_id);
    if (!empleado) return { error: 'Empleado no encontrado' };
    if (!empleado.lugar_id) return { error: 'El empleado no tiene un lugar asignado' };
    const lugar = await Lugar.findByPk(empleado.lugar_id);
    if (!lugar) return { error: 'Lugar del empleado no encontrado' };
    return { lugar };
  }
};

const validarUbicacion = (lugar, latitud_registro, longitud_registro) => {
  if (!latitud_registro || !longitud_registro) {
    return 'Se requieren latitud_registro y longitud_registro para registrar asistencia';
  }
  const distancia = calcularDistancia(
    parseFloat(lugar.latitud),
    parseFloat(lugar.longitud),
    parseFloat(latitud_registro),
    parseFloat(longitud_registro)
  );
  if (distancia > parseFloat(lugar.radio)) {
    return `Fuera del área permitida. Distancia: ${Math.round(distancia)}m, Radio permitido: ${lugar.radio}m`;
  }
  return null;
};

const validarCamposPorTipo = (tipo, body) => {
  if (!tipo || !['diaria', 'evento'].includes(tipo)) {
    return 'El campo tipo debe ser "diaria" o "evento"';
  }
  if (tipo === 'evento') {
    if (!body.eventos_id) return 'eventos_id es requerido para tipo evento';
    if (!body.empleado_evento_id) return 'empleado_evento_id es requerido para tipo evento';
  }
  if (tipo === 'diaria') {
    if (body.eventos_id || body.empleado_evento_id) {
      return 'eventos_id y empleado_evento_id no aplican para tipo diaria';
    }
  }
  return null;
};

const obtenerHorarioEmpleado = async (empleado_id) => {
  const empleadoHorario = await EmpleadoHorario.findOne({
    where: { empleado_id },
    include: [{ model: Horario }]
  });
  return empleadoHorario?.Horario || null;
};

// ================= ASISTENCIA ACTIVA =================
const asistenciaActiva = async (req, res) => {
  try {
    const empleado_id = req.user.id;
    const activa = await Asistencia.findOne({
      where: {
        empleado_id,
        hora_salida: null,
        incompleta: { [Op.ne]: true }
      },
      order: [['id', 'DESC']]
    });
    res.json(activa || null);
  } catch (err) {
    res.status(500).json({ error: 'Error al buscar asistencia activa', detalle: err.message });
  }
};

// ================= REGISTRAR ENTRADA =================
const registrarEntrada = async (req, res) => {
  try {
    const empleado_id = req.user.id;
    const { tipo, eventos_id, empleado_evento_id, latitud_registro, longitud_registro } = req.body;

    const errorTipo = validarCamposPorTipo(tipo, req.body);
    if (errorTipo) return res.status(400).json({ error: errorTipo });

    // ✅ Solo bloquear si ya hay una asistencia activa sin cerrar (sin hora_salida)
    const activa = await Asistencia.findOne({
      where: { empleado_id, hora_salida: null, incompleta: { [Op.ne]: true } },
      order: [['id', 'DESC']]
    });
    if (activa) {
      return res.status(400).json({
        error: 'Ya tienes una asistencia activa, debes registrar tu salida primero',
        asistencia_activa: activa
      });
    }

    if (tipo === 'diaria') {
      // ✅ CAMBIO 1: Se eliminó la validación "yaRegistroHoy" que impedía
      // registrar más de una asistencia diaria en el mismo día.
      // Ahora el empleado puede volver a registrar entrada después de
      // haber registrado su salida, igual que una justificación.

      const horario = await obtenerHorarioEmpleado(empleado_id);
      if (!horario) {
        return res.status(400).json({ error: 'No tienes un horario asignado, contacta a tu administrador' });
      }

      // Validar horario con tolerancia de 15 minutos
      const ahora = new Date();
      const [hIni, mIni] = horario.hora_inicio.split(':').map(Number);
      const [hFin, mFin] = horario.hora_fin.split(':').map(Number);

      const inicioHorario = new Date(ahora);
      inicioHorario.setHours(hIni, mIni, 0, 0);

      const finHorario = new Date(ahora);
      finHorario.setHours(hFin, mFin, 0, 0);

      const toleranciaMs = 15 * 60 * 1000;
      const limiteEntrada = new Date(inicioHorario.getTime() - toleranciaMs);
      const limiteTarde = new Date(finHorario.getTime() + toleranciaMs);
      const limiteSinTardanza = new Date(inicioHorario.getTime() + toleranciaMs);

      if (ahora < limiteEntrada) {
        const minutos = Math.ceil((limiteEntrada - ahora) / 60000);
        return res.status(400).json({
          error: `Aún no puedes registrar entrada, faltan ${minutos} minuto(s) para poder hacerlo`
        });
      }

      if (ahora > limiteTarde) {
        return res.status(400).json({
          error: 'Ya pasó el tiempo permitido para registrar tu entrada de hoy'
        });
      }

      const esTardanza = ahora > limiteSinTardanza;

      const { lugar, error: errorLugar } = await obtenerLugar(tipo, req.body, empleado_id);
      if (errorLugar) return res.status(400).json({ error: errorLugar });

      const errorUbicacion = validarUbicacion(lugar, latitud_registro, longitud_registro);
      if (errorUbicacion) return res.status(400).json({ error: errorUbicacion });

      const asistencia = await Asistencia.create({
        empleado_id,
        tipo,
        hora_entrada: ahora,
        horario_id: horario.id,
        tardanza: esTardanza,
        latitud_registro: latitud_registro ?? null,
        longitud_registro: longitud_registro ?? null
      });

      return res.status(201).json({
        ...asistencia.toJSON(),
        horario: {
          id: horario.id,
          nombre: horario.nombre,
          hora_inicio: horario.hora_inicio,
          hora_fin: horario.hora_fin,
          tiene_almuerzo: !!(horario.inicio_almuerzo && horario.fin_almuerzo),
          inicio_almuerzo: horario.inicio_almuerzo,
          fin_almuerzo: horario.fin_almuerzo
        }
      });
    }

    // ---- TIPO EVENTO ----
    if (tipo === 'evento') {
      const yaAsistio = await Asistencia.findOne({ where: { empleado_id, eventos_id } });
      if (yaAsistio) {
        return res.status(400).json({ error: 'Ya registraste asistencia a este evento' });
      }

      const { lugar, error: errorLugar } = await obtenerLugar(tipo, req.body, empleado_id);
      if (errorLugar) return res.status(400).json({ error: errorLugar });

      const evento = await Evento.findByPk(eventos_id);
      const fechaHoraEvento = new Date(`${evento.fecha}T${evento.hora}`);
      const limiteEntrada = new Date(fechaHoraEvento.getTime() - 10 * 60 * 1000);
      const ahora = new Date();

      if (ahora < limiteEntrada) {
        const minutosRestantes = limiteEntrada - ahora;
        const dias = Math.floor(minutosRestantes / (1000 * 60 * 60 * 24));
        const horas = Math.floor((minutosRestantes % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.ceil(((minutosRestantes % (1000 * 60 * 60 * 24)) % (1000 * 60 * 60)) / (1000 * 60));
        let partes = [];
        if (dias > 0) partes.push(`${dias} día${dias > 1 ? 's' : ''}`);
        if (horas > 0) partes.push(`${horas} hora${horas > 1 ? 's' : ''}`);
        if (minutos > 0) partes.push(`${minutos} minuto${minutos > 1 ? 's' : ''}`);
        return res.status(400).json({
          error: `Aún no puedes registrar entrada, faltan ${partes.join(', ')} para poder hacerlo`
        });
      }

      const errorUbicacion = validarUbicacion(lugar, latitud_registro, longitud_registro);
      if (errorUbicacion) return res.status(400).json({ error: errorUbicacion });

      const asistencia = await Asistencia.create({
        empleado_id,
        tipo,
        eventos_id,
        empleado_evento_id,
        hora_entrada: new Date(),
        latitud_registro: latitud_registro ?? null,
        longitud_registro: longitud_registro ?? null
      });

      return res.status(201).json(asistencia);
    }

  } catch (err) {
    res.status(500).json({ error: 'Error al registrar entrada', detalle: err.message });
  }
};

// ================= REGISTRAR SALIDA ALMUERZO =================
const registrarSalidaAlmuerzo = async (req, res) => {
  try {
    const empleado_id = req.user.id;
    const { latitud_registro, longitud_registro } = req.body;

    const asistencia = await Asistencia.findOne({
      where: { empleado_id, hora_salida: null },
      order: [['id', 'DESC']]
    });

    if (!asistencia) return res.status(400).json({ error: 'No tienes una asistencia activa' });
    if (!asistencia.horario_id) return res.status(400).json({ error: 'Tu horario no tiene almuerzo registrado' });
    if (asistencia.salida_almuerzo) return res.status(400).json({ error: 'Ya registraste tu salida de almuerzo' });

    const horario = await Horario.findByPk(asistencia.horario_id);
    if (!horario?.inicio_almuerzo) {
      return res.status(400).json({ error: 'Tu horario no contempla almuerzo' });
    }

    // ✅ CAMBIO 2: Se eliminó la validación de hora que impedía registrar
    // la salida de almuerzo antes de la hora programada.
    // Ahora el empleado puede salir a almorzar en cualquier momento.

    const { lugar, error: errorLugar } = await obtenerLugar('diaria', {}, empleado_id);
    if (errorLugar) return res.status(400).json({ error: errorLugar });

    const errorUbicacion = validarUbicacion(lugar, latitud_registro, longitud_registro);
    if (errorUbicacion) return res.status(400).json({ error: errorUbicacion });

    await asistencia.update({ salida_almuerzo: new Date() });
    res.json({ message: 'Salida de almuerzo registrada correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar salida de almuerzo', detalle: err.message });
  }
};

// ================= REGISTRAR REGRESO ALMUERZO =================
const registrarRegresoAlmuerzo = async (req, res) => {
  try {
    const empleado_id = req.user.id;
    const { latitud_registro, longitud_registro } = req.body;

    const asistencia = await Asistencia.findOne({
      where: { empleado_id, hora_salida: null },
      order: [['id', 'DESC']]
    });

    if (!asistencia) return res.status(400).json({ error: 'No tienes una asistencia activa' });
    if (!asistencia.salida_almuerzo) return res.status(400).json({ error: 'Primero debes registrar tu salida de almuerzo' });
    if (asistencia.regreso_almuerzo) return res.status(400).json({ error: 'Ya registraste tu regreso de almuerzo' });

    const { lugar, error: errorLugar } = await obtenerLugar('diaria', {}, empleado_id);
    if (errorLugar) return res.status(400).json({ error: errorLugar });

    const errorUbicacion = validarUbicacion(lugar, latitud_registro, longitud_registro);
    if (errorUbicacion) return res.status(400).json({ error: errorUbicacion });

    await asistencia.update({ regreso_almuerzo: new Date() });
    res.json({ message: 'Regreso de almuerzo registrado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar regreso de almuerzo', detalle: err.message });
  }
};

// ================= REGISTRAR SALIDA =================
const registrarSalida = async (req, res) => {
  try {
    const empleado_id = req.user.id;

    const asistencia = await Asistencia.findOne({
      where: { empleado_id, hora_salida: null },
      order: [['id', 'DESC']]
    });

    if (!asistencia) {
      return res.status(400).json({ error: 'No tienes una asistencia activa para registrar salida' });
    }

    if (asistencia.salida_almuerzo && !asistencia.regreso_almuerzo) {
      return res.status(400).json({ error: 'Debes registrar tu regreso de almuerzo antes de salir' });
    }

    const { latitud_registro, longitud_registro, motivo_salida_anticipada } = req.body;

    let esSalidaAnticipada = false;
    let esSalidaTardia = false;

    if (asistencia.horario_id) {
      const horario = await Horario.findByPk(asistencia.horario_id);
      if (horario) {
        const ahora = new Date();
        const [hFin, mFin] = horario.hora_fin.split(':').map(Number);
        const finHorario = new Date(ahora);
        finHorario.setHours(hFin, mFin, 0, 0);

        const toleranciaMs = 15 * 60 * 1000;
        const limiteAnticipada = new Date(finHorario.getTime() - toleranciaMs);
        const limiteTardia = new Date(finHorario.getTime() + toleranciaMs);

        if (ahora < limiteAnticipada) {
          if (!motivo_salida_anticipada || motivo_salida_anticipada.trim() === '') {
            return res.status(400).json({
              error: 'Estás saliendo antes de tiempo, debes indicar el motivo',
              salida_anticipada: true
            });
          }
          esSalidaAnticipada = true;
        } else if (ahora > limiteTardia) {
          esSalidaTardia = true;
        }
      }
    }

    const { lugar, error: errorLugar } = await obtenerLugar(
      asistencia.tipo,
      { eventos_id: asistencia.eventos_id },
      asistencia.empleado_id
    );
    if (errorLugar) return res.status(400).json({ error: errorLugar });

    const errorUbicacion = validarUbicacion(lugar, latitud_registro, longitud_registro);
    if (errorUbicacion) return res.status(400).json({ error: errorUbicacion });

    await asistencia.update({
      hora_salida: new Date(),
      salida_anticipada: esSalidaAnticipada,
      motivo_salida_anticipada: esSalidaAnticipada ? motivo_salida_anticipada.trim() : null,
      salida_tardia: esSalidaTardia,
      ...(latitud_registro != null && { latitud_registro }),
      ...(longitud_registro != null && { longitud_registro })
    });

    res.json({ message: 'Salida registrada correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar salida', detalle: err.message });
  }
};

// ================= MIS ASISTENCIAS =================
const misAsistencias = async (req, res) => {
  try {
    const empleado_id = req.user.id;
    const { desde, hasta } = req.query;
    const where = { empleado_id };
    if (desde || hasta) {
      where.hora_entrada = {};
      if (desde) where.hora_entrada[Op.gte] = new Date(desde + 'T00:00:00');
      if (hasta) where.hora_entrada[Op.lte] = new Date(hasta + 'T23:59:59');
    }
    const asistencias = await Asistencia.findAll({ where, order: [['id', 'DESC']] });
    res.json(asistencias);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener asistencias', detalle: err.message });
  }
};

const obtenerAsistencias = async (_req, res) => {
  try {
    const asistencias = await Asistencia.findAll({ order: [['id', 'DESC']] });
    res.json(asistencias);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener asistencias', detalle: err.message });
  }
};

const obtenerAsistenciaPorId = async (req, res) => {
  try {
    const asistencia = await Asistencia.findByPk(req.params.id);
    if (!asistencia) return res.status(404).json({ error: 'Asistencia no encontrada' });
    res.json(asistencia);
  } catch (err) {
    res.status(500).json({ error: 'Error al buscar asistencia', detalle: err.message });
  }
};

const obtenerAsistenciasRango = async (req, res) => {
  try {
    const { desde, hasta, empleadoId } = req.query;
    const where = {};
    if (empleadoId) where.empleado_id = empleadoId;
    if (desde || hasta) {
      where.hora_entrada = {};
      if (desde) where.hora_entrada[Op.gte] = new Date(desde + 'T00:00:00');
      if (hasta) where.hora_entrada[Op.lte] = new Date(hasta + 'T23:59:59');
    }
    const asistencias = await Asistencia.findAll({ where, order: [['id', 'DESC']] });
    res.json(asistencias);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener asistencias', detalle: err.message });
  }
};

const eliminarAsistencia = async (req, res) => {
  try {
    const asistencia = await Asistencia.findByPk(req.params.id);
    if (!asistencia) return res.status(404).json({ error: 'Asistencia no encontrada' });
    await asistencia.destroy();
    res.json({ message: 'Asistencia eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar asistencia', detalle: err.message });
  }
};

const resumenAsistencias = async (req, res) => {
  try {
    const { desde, hasta, empleadoId } = req.query;
    const where = {};
    if (empleadoId) where.empleado_id = Number(empleadoId);
    if (desde || hasta) {
      where.hora_entrada = {};
      if (desde) where.hora_entrada[Op.gte] = new Date(desde + 'T00:00:00');
      if (hasta) where.hora_entrada[Op.lte] = new Date(hasta + 'T23:59:59');
    }
    const registros = await Asistencia.findAll({
      where: { ...where, hora_salida: { [Op.ne]: null } }
    });
    let totalSeg = 0;
    registros.forEach(r => {
      const diff = new Date(r.hora_salida) - new Date(r.hora_entrada);
      if (diff > 0) totalSeg += Math.floor(diff / 1000);
    });
    res.json({
      horas: Math.floor(totalSeg / 3600),
      minutos: Math.floor((totalSeg % 3600) / 60),
      segundos: totalSeg % 60,
      totalRegistros: registros.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al calcular resumen', detalle: err.message });
  }
};

const resumenPorTipo = async (req, res) => {
  try {
    const empleado_id = req.user.id;
    const { desde, hasta } = req.query;
    const where = { empleado_id, hora_salida: { [Op.ne]: null } };
    if (desde || hasta) {
      where.hora_entrada = {};
      if (desde) where.hora_entrada[Op.gte] = new Date(desde + 'T00:00:00');
      if (hasta) where.hora_entrada[Op.lte] = new Date(hasta + 'T23:59:59');
    }
    const registros = await Asistencia.findAll({ where });
    const calcularTiempo = (lista) => {
      let totalSeg = 0;
      lista.forEach(r => {
        const diff = new Date(r.hora_salida) - new Date(r.hora_entrada);
        if (diff > 0) totalSeg += Math.floor(diff / 1000);
      });
      return {
        horas: Math.floor(totalSeg / 3600),
        minutos: Math.floor((totalSeg % 3600) / 60),
        totalRegistros: lista.length
      };
    };
    res.json({
      diaria: calcularTiempo(registros.filter(r => r.tipo === 'diaria')),
      evento: calcularTiempo(registros.filter(r => r.tipo === 'evento')),
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al calcular resumen', detalle: err.message });
  }
};

// ================= REPORTES =================

const reporteAsistencias = async (req, res) => {
  try {
    const { desde, hasta, empleadoId, eventoId } = req.query;
    const where = {};

    if (empleadoId) where.empleado_id = Number(empleadoId);
    if (eventoId) where.eventos_id = Number(eventoId);

    if (desde || hasta) {
      where.hora_entrada = {};
      if (desde) where.hora_entrada[Op.gte] = new Date(desde + 'T00:00:00');
      if (hasta) where.hora_entrada[Op.lte] = new Date(hasta + 'T23:59:59');
    }

    const registros = await Asistencia.findAll({
      where,
      include: [
        { model: Empleado, attributes: ['id', 'nombre', 'apellido', 'cedula'] },
        { model: Horario, attributes: ['id', 'nombre', 'hora_inicio', 'hora_fin'] },
        { model: Evento, attributes: ['id', 'titulo'] }   // ← nuevo
      ],
      order: [['hora_entrada', 'DESC']]
    });
   
    const data = registros.map(r => {
      const entrada = r.hora_entrada ? new Date(r.hora_entrada) : null;
      const salida = r.hora_salida ? new Date(r.hora_salida) : null;
      let horasTrabajadas = 0;
      let minutosTrabajados = 0;
      if (entrada && salida) {
        const diffSeg = Math.floor((salida - entrada) / 1000);
        horasTrabajadas = Math.floor(diffSeg / 3600);
        minutosTrabajados = Math.floor((diffSeg % 3600) / 60);
      }
      return {
        id: r.id,
        empleado_id: r.empleado_id,
        empleado_nombre: r.empleado ? `${r.empleado.nombre} ${r.empleado.apellido}` : null,
        empleado_cedula: r.empleado?.cedula || null,
        tipo: r.tipo,
        fecha: entrada ? entrada.toISOString().split('T')[0] : null,
        hora_entrada: r.hora_entrada,
        hora_salida: r.hora_salida,
        salida_almuerzo: r.salida_almuerzo,
        regreso_almuerzo: r.regreso_almuerzo,
        horario: r.Horario ? {
          nombre: r.Horario.nombre,
          hora_inicio: r.Horario.hora_inicio,
          hora_fin: r.Horario.hora_fin
        } : null,
        eventos_id: r.eventos_id || null,
        evento_titulo: r.evento?.titulo || null,  // ← nuevo
        tardanza: r.tardanza,
        salida_anticipada: r.salida_anticipada,
        motivo_salida_anticipada: r.motivo_salida_anticipada,
        salida_tardia: r.salida_tardia,
        horas_trabajadas: horasTrabajadas,
        minutos_trabajados: minutosTrabajados,
        completo: !!r.hora_salida
      };
    });

    res.json(data);
  } catch (err) {
    console.error('ERROR REPORTE:', err); // ← agrega esto
    res.status(500).json({ error: 'Error al generar reporte', detalle: err.message });
  }
};

const reporteResumenPorEmpleado = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const where = { tipo: 'diaria' };
    if (desde || hasta) {
      where.hora_entrada = {};
      if (desde) where.hora_entrada[Op.gte] = new Date(desde + 'T00:00:00');
      if (hasta) where.hora_entrada[Op.lte] = new Date(hasta + 'T23:59:59');
    }

    const registros = await Asistencia.findAll({
      where,
      include: [{ model: Empleado, attributes: ['id', 'nombre', 'apellido', 'cedula'] }],
      order: [['hora_entrada', 'DESC']]
    });
    const porEmpleado = {};
    registros.forEach(r => {
      const eid = r.empleado_id;
      if (!porEmpleado[eid]) {
        porEmpleado[eid] = {
          empleado_id: eid,
          nombre: r.empleado ? `${r.empleado.nombre} ${r.empleado.apellido}` : `Empleado ${eid}`,
          cedula: r.empleado?.cedula || null,
          dias_trabajados: 0,
          dias_completos: 0,
          tardanzas: 0,
          salidas_anticipadas: 0,
          salidas_tardias: 0,
          total_segundos: 0
        };
      }
      const emp = porEmpleado[eid];
      emp.dias_trabajados++;
      if (r.hora_salida) {
        emp.dias_completos++;
        const diff = new Date(r.hora_salida) - new Date(r.hora_entrada);
        if (diff > 0) emp.total_segundos += Math.floor(diff / 1000);
      }
      if (r.tardanza) emp.tardanzas++;
      if (r.salida_anticipada) emp.salidas_anticipadas++;
      if (r.salida_tardia) emp.salidas_tardias++;
    });

    const resumen = Object.values(porEmpleado).map(e => ({
      ...e,
      promedio_horas: e.dias_completos > 0
        ? `${Math.floor(e.total_segundos / e.dias_completos / 3600)}h ${Math.floor((e.total_segundos / e.dias_completos % 3600) / 60)}m`
        : '0h 00m',
      total_horas: `${Math.floor(e.total_segundos / 3600)}h ${Math.floor((e.total_segundos % 3600) / 60)}m`
    }));

    res.json(resumen);
  } catch (err) {
    res.status(500).json({ error: 'Error al generar reporte resumen', detalle: err.message });
  }
};

const miReporte = async (req, res) => {
  try {
    const empleado_id = req.user.id;
    const { desde, hasta } = req.query;
    const where = { empleado_id };
    if (desde || hasta) {
      where.hora_entrada = {};
      if (desde) where.hora_entrada[Op.gte] = new Date(desde + 'T00:00:00');
      if (hasta) where.hora_entrada[Op.lte] = new Date(hasta + 'T23:59:59');
    }

    const registros = await Asistencia.findAll({
      where,
      include: [{ model: Horario, attributes: ['nombre', 'hora_inicio', 'hora_fin'] }],
      order: [['hora_entrada', 'DESC']]
    });

    let totalSeg = 0;
    let tardanzas = 0;
    let salidasAnticipadas = 0;
    let salidasTardias = 0;
    let diasCompletos = 0;

    const detalle = registros.map(r => {
      const entrada = r.hora_entrada ? new Date(r.hora_entrada) : null;
      const salida = r.hora_salida ? new Date(r.hora_salida) : null;
      let diffSeg = 0;
      if (entrada && salida) {
        diffSeg = Math.floor((salida - entrada) / 1000);
        totalSeg += diffSeg;
        diasCompletos++;
      }
      if (r.tardanza) tardanzas++;
      if (r.salida_anticipada) salidasAnticipadas++;
      if (r.salida_tardia) salidasTardias++;

      return {
        id: r.id,
        tipo: r.tipo,
        fecha: entrada ? entrada.toISOString().split('T')[0] : null,
        hora_entrada: r.hora_entrada,
        hora_salida: r.hora_salida,
        salida_almuerzo: r.salida_almuerzo,
        regreso_almuerzo: r.regreso_almuerzo,
        horario: r.Horario?.nombre || null,
        tardanza: r.tardanza,
        salida_anticipada: r.salida_anticipada,
        motivo_salida_anticipada: r.motivo_salida_anticipada,
        salida_tardia: r.salida_tardia,
        horas_trabajadas: `${Math.floor(diffSeg / 3600)}h ${Math.floor((diffSeg % 3600) / 60)}m`,
        completo: !!r.hora_salida
      };
    });

    res.json({
      resumen: {
        total_registros: registros.length,
        dias_completos: diasCompletos,
        tardanzas,
        salidas_anticipadas: salidasAnticipadas,
        salidas_tardias: salidasTardias,
        total_horas: `${Math.floor(totalSeg / 3600)}h ${Math.floor((totalSeg % 3600) / 60)}m`,
        promedio_horas: diasCompletos > 0
          ? `${Math.floor(totalSeg / diasCompletos / 3600)}h ${Math.floor((totalSeg / diasCompletos % 3600) / 60)}m`
          : '0h 00m'
      },
      detalle
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al generar mi reporte', detalle: err.message });
  }
};

module.exports = {
  registrarEntrada,
  registrarSalida,
  registrarSalidaAlmuerzo,
  registrarRegresoAlmuerzo,
  obtenerAsistencias,
  obtenerAsistenciaPorId,
  obtenerAsistenciasRango,
  resumenAsistencias,
  eliminarAsistencia,
  asistenciaActiva,
  misAsistencias,
  resumenPorTipo,
  reporteAsistencias,
  reporteResumenPorEmpleado,
  miReporte
};