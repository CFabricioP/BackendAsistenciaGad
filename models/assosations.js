const Empleado = require('./empleadoModel');
const Notificacion = require('./notificacionModel');
const NotificacionEmpleado = require('./notificacionEmpleadoModel');
const Horario = require('./horarioModel');
const EmpleadoHorario = require('./empleadoHorarioModel');
const Grupo = require('./grupoModel');
const EmpleadoGrupo = require('./empleadoGrupoModel');
const Asistencia = require('./asistenciaModel'); // ← nuevo
const Evento = require('./eventoModel');          // ← nuevo

// Notificaciones
Notificacion.hasMany(NotificacionEmpleado, { foreignKey: 'notificacion_id', as: 'detalles' });
NotificacionEmpleado.belongsTo(Notificacion, { foreignKey: 'notificacion_id', as: 'notificacion' });
NotificacionEmpleado.belongsTo(Empleado, { foreignKey: 'empleado_id' });

// Horarios
EmpleadoHorario.belongsTo(Horario, { foreignKey: 'horario_id' });
EmpleadoHorario.belongsTo(Empleado, { foreignKey: 'empleado_id' });
Horario.hasMany(EmpleadoHorario, { foreignKey: 'horario_id' });
Empleado.hasMany(EmpleadoHorario, { foreignKey: 'empleado_id' });

// Grupos
EmpleadoGrupo.belongsTo(Empleado, { foreignKey: 'empleado_id' });
EmpleadoGrupo.belongsTo(Grupo, { foreignKey: 'grupo_id' });
Empleado.hasMany(EmpleadoGrupo, { foreignKey: 'empleado_id' });
Grupo.hasMany(EmpleadoGrupo, { foreignKey: 'grupo_id' });

// Asistencia ← nuevo
Asistencia.belongsTo(Empleado, { foreignKey: 'empleado_id' });
Asistencia.belongsTo(Horario,  { foreignKey: 'horario_id' });
Asistencia.belongsTo(Evento,   { foreignKey: 'eventos_id' });
Evento.hasMany(Asistencia,     { foreignKey: 'eventos_id' });