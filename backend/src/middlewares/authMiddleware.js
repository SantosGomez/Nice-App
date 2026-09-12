import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nice_jewelry_pos_secret_key_2026_super_secure';

/**
 * Middleware para verificar la validez del token JWT en las peticiones.
 */
export function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Acceso no autorizado: Token no proporcionado'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      message: 'Formato de token inválido. Se espera "Bearer <token>"'
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado. Por favor inicia sesión nuevamente.'
    });
  }
}

/**
 * Middleware para validar si el usuario es Administrador o SuperAdmin.
 */
export function soloAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'No autenticado' });
  }

  // RolId: 1 (SuperAdmin), 2 (Admin)
  if (req.user.RolId === 1 || req.user.RolId === 2 || req.user.Rol === 'SuperAdmin' || req.user.Rol === 'Admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Permiso denegado: Se requieren privilegios de administrador'
  });
}
