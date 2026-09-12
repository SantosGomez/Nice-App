import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { EmpresariaModel } from '../models/empresariaModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'nice_jewelry_pos_secret_key_2026_super_secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const AuthController = {
  /**
   * Inicio de sesión para empresarias / usuarios.
   * Valida EIN y contraseña (soporta tanto bcrypt como claves iniciales).
   */
  async login(req, res) {
    try {
      const { EIN, Password } = req.body;

      if (!EIN || !Password) {
        return res.status(400).json({
          success: false,
          message: 'Debes proporcionar tu número de empresaria (EIN) y contraseña'
        });
      }

      const empresaria = await EmpresariaModel.findByEIN(String(EIN).trim());

      if (!empresaria) {
        return res.status(401).json({
          success: false,
          message: 'Número de empresaria (EIN) o contraseña incorrectos'
        });
      }

      if (empresaria.Estado === 'Inactiva') {
        return res.status(403).json({
          success: false,
          message: 'Tu cuenta se encuentra inactiva. Comunícate con la administradora.'
        });
      }

      // Comparación de contraseña: si es hash bcrypt o si es texto plano inicial
      let isMatch = false;
      const passGuardada = empresaria.Password || '';

      if (
        passGuardada.startsWith('$2a$') ||
        passGuardada.startsWith('$2b$') ||
        passGuardada.startsWith('$2y$')
      ) {
        isMatch = await bcrypt.compare(Password, passGuardada);
      } else {
        isMatch = passGuardada === Password;
        // Si coincidió en texto plano, actualizamos automáticamente a bcrypt
        if (isMatch && Password.length >= 1) {
          const hashNuevo = await bcrypt.hash(Password, 10);
          await EmpresariaModel.update(empresaria.IdEmpresaria, { Password: hashNuevo });
        }
      }

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Número de empresaria (EIN) o contraseña incorrectos'
        });
      }

      // Preparar payload y generar Token JWT
      const userPayload = {
        IdEmpresaria: empresaria.IdEmpresaria,
        EIN: empresaria.EIN,
        Nombre: empresaria.Nombre,
        Telefono: empresaria.Telefono,
        PorcentajeDescuento: Number(empresaria.PorcentajeDescuento || 25.0),
        Estado: empresaria.Estado,
        RolId: empresaria.RolId,
        Rol: empresaria.Rol
      };

      const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      res.status(200).json({
        success: true,
        message: `¡Bienvenida a Nice, ${empresaria.Nombre}!`,
        token,
        user: userPayload
      });
    } catch (err) {
      console.error('Error en AuthController.login:', err);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor al intentar iniciar sesión'
      });
    }
  },

  /**
   * Registro de nueva empresaria / usuario en el sistema.
   */
  async register(req, res) {
    try {
      const {
        EIN,
        Password,
        Nombre,
        Telefono = null,
        PorcentajeDescuento = 25.0,
        RolId = 3 // Por defecto 3 = Empresario
      } = req.body;

      if (!EIN || !Password || !Nombre) {
        return res.status(400).json({
          success: false,
          message: 'EIN, Nombre y Contraseña son obligatorios'
        });
      }

      const einLimpio = String(EIN).trim();
      const passLimpia = String(Password).trim();
      const nombreLimpio = String(Nombre).trim();

      if (passLimpia.length < 4) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 4 caracteres'
        });
      }

      // Validar si el EIN ya existe
      const existente = await EmpresariaModel.findByEIN(einLimpio);
      if (existente) {
        return res.status(409).json({
          success: false,
          message: `El número de empresaria (EIN) "${einLimpio}" ya se encuentra registrado`
        });
      }

      // Hashear la contraseña con bcrypt
      const hashedPassword = await bcrypt.hash(passLimpia, 10);

      const nuevaEmpresaria = await EmpresariaModel.create({
        EIN: einLimpio,
        Password: hashedPassword,
        Nombre: nombreLimpio,
        Telefono: Telefono ? String(Telefono).trim() : null,
        PorcentajeDescuento: Number(PorcentajeDescuento) || 25.0,
        Estado: 'Activa',
        RolId: Number(RolId) || 3
      });

      // Obtener registro completo con Rol
      const userCompleto = await EmpresariaModel.getById(nuevaEmpresaria.IdEmpresaria);

      const userPayload = {
        IdEmpresaria: userCompleto.IdEmpresaria,
        EIN: userCompleto.EIN,
        Nombre: userCompleto.Nombre,
        Telefono: userCompleto.Telefono,
        PorcentajeDescuento: Number(userCompleto.PorcentajeDescuento || 25.0),
        Estado: userCompleto.Estado,
        RolId: userCompleto.RolId,
        Rol: userCompleto.Rol
      };

      const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      res.status(201).json({
        success: true,
        message: 'Registro exitoso. ¡Bienvenida a Joyería Nice!',
        token,
        user: userPayload
      });
    } catch (err) {
      console.error('Error en AuthController.register:', err);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor al registrar el usuario'
      });
    }
  },

  /**
   * Obtiene los datos del perfil activo a partir del token.
   */
  async me(req, res) {
    try {
      const user = await EmpresariaModel.getById(req.user.IdEmpresaria);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.status(200).json({
        success: true,
        user: {
          ...user,
          PorcentajeDescuento: Number(user.PorcentajeDescuento || 25.0)
        }
      });
    } catch (err) {
      console.error('Error en AuthController.me:', err);
      res.status(500).json({
        success: false,
        message: 'Error al obtener datos del perfil'
      });
    }
  }
};

export default AuthController;
