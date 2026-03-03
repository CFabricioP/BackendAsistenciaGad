module.exports.requireRole = function requireRole(rol_id) {
  return (req, res, next) => {
    console.log('req.user:', req.user);        // 👈
    console.log('rol_id requerido:', rol_id); 
    if (!req.user) return res.status(401).json({ error: 'No autenticado' });
    if (req.user.rol_id !== rol_id) return res.status(403).json({ error: 'No autorizado' });
    next();
  };
};

