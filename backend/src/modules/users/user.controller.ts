import { Response } from 'express';
import { User, USER_ROLES } from '../users/user.model';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import bcrypt from 'bcryptjs';

/**
 * GET /api/users
 * PLATFORM_ADMIN sees all; ORG_ADMIN sees only their org users.
 */
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: any = { isActive: true };
    if (req.user!.role !== 'PLATFORM_ADMIN') {
      filter.organizationId = (req.user!.organizationId as string);
    }
    const users = await User.find(filter).select('-passwordHash').sort({ lastName: 1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error });
  }
};

/**
 * POST /api/users
 * PLATFORM_ADMIN or ORG_ADMIN can create/invite users into the system.
 */
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password, role, phone, organizationId } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
      res.status(400).json({ message: 'firstName, lastName, email, password, and role are required' });
      return;
    }

    if (!USER_ROLES.includes(role)) {
      res.status(400).json({ message: `Invalid role. Must be one of: ${USER_ROLES.join(', ')}` });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(400).json({ message: 'A user with this email already exists' });
      return;
    }

    // ORG_ADMIN can only create users in their own org
    const assignedOrgId =
      req.user!.role === 'PLATFORM_ADMIN'
        ? organizationId || (req.user!.organizationId as string)
        : (req.user!.organizationId as string);

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      passwordHash,
      phone,
      role,
      organizationId: assignedOrgId,
    });

    res.status(201).json({
      _id:            user._id,
      firstName:      user.firstName,
      lastName:       user.lastName,
      email:          user.email,
      role:           user.role,
      organizationId: user.organizationId,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create user', error });
  }
};

/**
 * GET /api/users/:id
 */
export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: any = { _id: req.params.id };
    if (req.user!.role !== 'PLATFORM_ADMIN') {
      filter.organizationId = (req.user!.organizationId as string);
    }
    const user = await User.findOne(filter).select('-passwordHash');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user', error });
  }
};

/**
 * PUT /api/users/:id — update profile / role
 */
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Prevent role escalation beyond own level
    if (req.body.role && req.user!.role !== 'PLATFORM_ADMIN' && req.body.role === 'PLATFORM_ADMIN') {
      res.status(403).json({ message: 'Cannot assign PLATFORM_ADMIN role' });
      return;
    }

    const filter: any = { _id: req.params.id };
    if (req.user!.role !== 'PLATFORM_ADMIN') {
      filter.organizationId = (req.user!.organizationId as string);
    }

    const { firstName, lastName, phone, role, isActive } = req.body;
    const user = await User.findOneAndUpdate(
      filter,
      { firstName, lastName, phone, role, isActive },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user', error });
  }
};

/**
 * DELETE /api/users/:id — soft delete
 */
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: any = { _id: req.params.id };
    if (req.user!.role !== 'PLATFORM_ADMIN') {
      filter.organizationId = (req.user!.organizationId as string);
    }
    const user = await User.findOneAndUpdate(filter, { isActive: false }, { new: true }).select('-passwordHash');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json({ message: 'User deactivated', user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to deactivate user', error });
  }
};
