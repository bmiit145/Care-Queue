import { Response } from 'express';
import { User, USER_ROLES } from '../users/user.model';
import { Organization } from '../organizations/organization.model';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import bcrypt from 'bcryptjs';
import { orgIdOf } from '../../shared/tenant/orgScope';
import { failed } from '../../shared/http/respond';

/**
 * GET /api/users
 * PLATFORM_ADMIN sees all; ORG_ADMIN sees only their org users.
 */
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: any = { isActive: true };
    if (req.user!.role !== 'PLATFORM_ADMIN') {
      filter.organizationId = orgIdOf(req);
    }
    const users = await User.find(filter).select('-passwordHash').sort({ lastName: 1 });
    res.status(200).json(users);
  } catch (error) {
    failed(res, 'Failed to fetch users', error);
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

    // updateUser already blocked this; createUser did not, which let an
    // ORG_ADMIN mint a PLATFORM_ADMIN account and then log in as it.
    if (role === 'PLATFORM_ADMIN' && req.user!.role !== 'PLATFORM_ADMIN') {
      res.status(403).json({ message: 'Cannot assign PLATFORM_ADMIN role' });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(400).json({ message: 'A user with this email already exists' });
      return;
    }

    // A PLATFORM_ADMIN may place the user in any organization, or in none at
    // all when creating another platform-level account. Everyone else is
    // pinned to their own tenant regardless of what the body asked for.
    let assignedOrgId: string | undefined;

    if (req.user!.role === 'PLATFORM_ADMIN') {
      if (organizationId) {
        const org = await Organization.findById(organizationId).select('_id').lean();
        if (!org) {
          res.status(400).json({ message: 'organizationId does not reference an existing organization' });
          return;
        }
        assignedOrgId = organizationId;
      }
    } else {
      assignedOrgId = orgIdOf(req);
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Built conditionally: exactOptionalPropertyTypes forbids handing Mongoose
    // an explicit `organizationId: undefined` for a platform-level account.
    const userPayload: Record<string, unknown> = {
      firstName,
      lastName,
      email: email.toLowerCase(),
      passwordHash,
      phone,
      role,
    };
    if (assignedOrgId) userPayload.organizationId = assignedOrgId;

    const user = await User.create(userPayload);

    res.status(201).json({
      _id:            user._id,
      firstName:      user.firstName,
      lastName:       user.lastName,
      email:          user.email,
      role:           user.role,
      organizationId: user.organizationId,
    });
  } catch (error) {
    failed(res, 'Failed to create user', error);
  }
};

/**
 * GET /api/users/:id
 */
export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: any = { _id: req.params.id };
    if (req.user!.role !== 'PLATFORM_ADMIN') {
      filter.organizationId = orgIdOf(req);
    }
    const user = await User.findOne(filter).select('-passwordHash');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    failed(res, 'Failed to fetch user', error);
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
      filter.organizationId = orgIdOf(req);
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
    failed(res, 'Failed to update user', error);
  }
};

/**
 * DELETE /api/users/:id — soft delete
 */
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: any = { _id: req.params.id };
    if (req.user!.role !== 'PLATFORM_ADMIN') {
      filter.organizationId = orgIdOf(req);
    }
    const user = await User.findOneAndUpdate(filter, { isActive: false }, { new: true }).select('-passwordHash');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json({ message: 'User deactivated', user });
  } catch (error) {
    failed(res, 'Failed to deactivate user', error);
  }
};
