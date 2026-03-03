// app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const db = require('./config/db');
dotenv.config();

const app = express();

/* ===== Red/CORS ===== */
app.set('trust proxy', 1);

const corsOptions = {
  origin: (origin, cb) => cb(null, true), // permitir todo en dev/LAN
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
};
app.use(cors(corsOptions));
app.use((req,res,next)=>{
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', corsOptions.methods.join(','));
    res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(','));
    return res.sendStatus(204);
  }
  next();
});

/* ===== Body parsers ===== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===== Log simple ===== */
app.use((req,_res,next)=>{ console.log(req.method, req.path); next(); });

/* ===== DB ===== */
db.authenticate()
  .then(()=> console.log('Conectado a PostgreSQL'))
  .catch(err=> console.error('Error de conexión:', err));

/* ===== Health & config ===== */
const healthHandler = (_req, res) => res.status(200).json({ ok: true, ts: Date.now() });

app.get('/', (_req,res)=> res.status(200).send('Backend API funcionando correctamente.'));
app.get('/ping', healthHandler);
app.get('/api/ping', healthHandler);
app.get('/api/health', healthHandler);

// Endpoint directo usado por la app/curl
app.get('/health', healthHandler);
// HEAD liviano para checks
app.head('/health', (_req, res) => res.status(200).end());

let pkgInfo = { name:'app', version:'0.0.0' };
try { pkgInfo = require('./package.json'); } catch(_) {}
app.get('/api/version', (_req,res)=> res.json({ name:pkgInfo.name, version:pkgInfo.version, ts:Date.now() }));

app.get('/api/config', (req,res)=>{
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  res.json({
    baseUrl: `${proto}://${host}`,
    ipHint: host && host.includes(':') ? host.split(':')[0] : host
  });
});

/* ===== Helper para montar rutas y ver errores reales ===== */
function safeMount(mountPath, modulePath) {
  try {
    app.use(mountPath, require(modulePath));
    console.log(`RUTA: ${mountPath} -> ${modulePath}`);
  } catch (e) {
    console.error(`(ERROR) No se pudo montar ${mountPath} desde ${modulePath}:`, e.message);
  }
}
require('./models/assosations'); // 👈 agrega

/* ===== Rutas API ===== */
safeMount('/api/auth',              './routes/authRoutes');
safeMount('/api/lugares',           './routes/lugarRoutes');
safeMount('/api/empleados', './routes/empleadosRoutes');
safeMount('/api/empleado-eventos',  './routes/empleadoEventoRoutes'); // <-- nuevo
safeMount('/api/roles',  './routes/rolRoutes');
safeMount('/api/cargos', './routes/cargoRoutes');

/* Asistencias: usa el archivo que SÍ existe en tu proyecto */
safeMount('/api/asistencias', './routes/asistenciaRoutes');
// safeMount('/asistencias',           './routes/asistenciaRoutes'); // alias
// safeMount('/api/asistencia',        './routes/asistenciaRoutes'); // alias
// safeMount('/api/attendance',        './routes/asistenciaRoutes'); // alias

/* Otros módulos opcionales */
safeMount('/api/notificaciones', './routes/notificacionRoutes');
safeMount('/api/eventos',           './routes/eventosRoutes');
safeMount('/api/puntos-encuentro',  './routes/puntoencuentroRoutes');
safeMount('/api/horarios',          './routes/horarioRoutes');
safeMount('/api/grupos',     './routes/gruposRoutes');
safeMount('/api/empleado-grupos', './routes/empleadoGrupoRoutes');
// safeMount('/api/workplaces', './routes/puestoTrabajoRoutes');
/* ===== Estáticos (panel admin) ===== */
app.use(express.static(path.join(__dirname, 'admin_web')));

/* ===== 404 solo para /api/* ===== */
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'Ruta no encontrada' });
  }
  next();
});

/* ===== Errores ===== */
app.use((err, _req, res, _next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({ message: 'Error interno del servidor' });
});

const { iniciarJob } = require('./jobs/cerrarAsistencias');


const PORT = process.env.PORT || 3000;
iniciarJob();

// IMPORTANTE: 0.0.0.0 permite conexiones desde el celular
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor escuchando en http://0.0.0.0:${PORT}`);
});
// Al final, antes de app.listen
