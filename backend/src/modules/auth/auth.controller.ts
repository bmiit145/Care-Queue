import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../users/user.model';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

/**
 * Generate a signed JWT embedding id, role, and organizationId.
 * organizationId is critical for tenant isolation on every subsequent request.
 */
const generateToken = (id: string, role: UserRole, organizationId?: string): string => {
  const secret = process.env.JWT_SECRET || 'changeme_in_production';
  return jwt.sign(
    { id, role, organizationId },
    secret,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );
};

// ─────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      role,
      organizationId,
    } = req.body;

    if (!firstName || !lastName || !email || !password) {
      res.status(400).json({ message: 'firstName, lastName, email, and password are required' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ message: 'A user with this email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const assignedRole: UserRole = role || 'PATIENT';

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      passwordHash,
      phone,
      role: assignedRole,
      organizationId: organizationId || undefined,
      isActive: true,
    });

    res.status(201).json({
      _id:            user._id,
      firstName:      user.firstName,
      lastName:       user.lastName,
      email:          user.email,
      role:           user.role,
      organizationId: user.organizationId,
      token: generateToken(
        user._id.toString(),
        user.role,
        user.organizationId?.toString()
      ),
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error });
  }
};

// ─────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    res.status(200).json({
      _id:            user._id,
      firstName:      user.firstName,
      lastName:       user.lastName,
      email:          user.email,
      role:           user.role,
      organizationId: user.organizationId,
      token: generateToken(
        user._id.toString(),
        user.role,
        user.organizationId?.toString()
      ),
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error });
  }
};

// ─────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────
export const getMe = async (req: any, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash').lean();
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile', error });
  }
};
