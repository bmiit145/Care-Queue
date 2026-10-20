import { Request, Response as ExpressResponse } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash, randomInt } from 'node:crypto';
import { User, UserRole } from '../users/user.model';
import { env } from '../../config/env';
import type { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { failed } from '../../shared/http/respond';
import { OtpChallenge } from './otpChallenge.model';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '90d';
const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

type WhatsAppResponse = {
  ok: boolean;
  status: number;
  text(): Promise<string>;
};

const normalizePhone = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  let phone = value.replace(/[\s()-]/g, '');
  // Auto-prepend +91 for 10-digit Indian mobile numbers (e.g. 9898038051 → +919898038051)
  if (/^[6-9]\d{9}$/.test(phone)) {
    phone = `+91${phone}`;
  }
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null;
};

const hashOtp = (otp: string): string => createHash('sha256').update(otp).digest('hex');

/**
 * Generate a signed JWT embedding id, role, and organizationId.
 * organizationId is critical for tenant isolation on every subsequent request.
 *
 * Signs with `env.jwtSecret` — the same value `protect` verifies with, and the
 * only one validated at boot for length. Reading process.env directly here
 * meant sign and verify could diverge, behind a 'changeme_in_production'
 * fallback that would have silently accepted a trivially forgeable secret.
 */
const generateToken = (id: string, role: UserRole, organizationId?: string): string => {
  return jwt.sign(
    { id, role, organizationId },
    env.jwtSecret,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );
};

const generateRefreshToken = (id: string): string => {
  return jwt.sign({ id, type: 'refresh' }, env.jwtSecret, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  } as jwt.SignOptions);
};

type PublicUserSource = {
  _id: { toString(): string };
  firstName?: string | null;
  lastName?: string | null;
  age?: number | null;
  gender?: string | null;
  email?: string | null;
  phone?: string | null;
  role: UserRole;
  organizationId?: { toString(): string };
  profileCompleted: boolean;
};

// Mobile clients expect "" rather than null for profile fields that are not filled yet.
const publicUser = (user: PublicUserSource) => ({
  _id: user._id,
  firstName: user.firstName ?? '',
  lastName: user.lastName ?? '',
  age: user.age ?? '',
  gender: user.gender ?? '',
  email: user.email ?? '',
  phone: user.phone ?? '',
  role: user.role,
  organizationId: user.organizationId,
  profileCompleted: user.profileCompleted,
});

const authResponse = (user: PublicUserSource) => ({
  user: publicUser(user),
  accessToken: generateToken(user._id.toString(), user.role, user.organizationId?.toString()),
  refreshToken: generateRefreshToken(user._id.toString()),
});

// Returns the user id from a valid Bearer access token, undefined if no token
// was sent, or null if a token was sent but is invalid/expired.
const bearerUserId = (req: Request): string | null | undefined => {
  const header = req.headers.authorization;
  if (!header) return undefined;
  if (!header.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(header.slice('Bearer '.length).trim(), env.jwtSecret, { algorithms: ['HS256'] });
    if (typeof decoded === 'string' || decoded.type === 'refresh' || typeof decoded.id !== 'string') return null;
    return decoded.id;
  } catch {
    return null;
  }
};

const sendWhatsAppOtp = async (phone: string, otp: string): Promise<void> => {
  const { metaWhatsappAccessToken, metaWhatsappPhoneNumberId, metaWhatsappTemplateName, metaWhatsappTemplateLanguage } = env;
  if (!metaWhatsappAccessToken || !metaWhatsappPhoneNumberId || !metaWhatsappTemplateName) {
    throw new Error('Meta WhatsApp OTP credentials are not configured');
  }

  const components: Array<Record<string, unknown>> = [
    { type: 'body', parameters: [{ type: 'text', text: otp }] },
    {
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [{ type: 'text', text: otp }],
    },
  ];

  const response = await fetch(`https://graph.facebook.com/v21.0/${metaWhatsappPhoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${metaWhatsappAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: metaWhatsappTemplateName,
        language: { code: metaWhatsappTemplateLanguage },
        components,
      },
    }),
  }) as unknown as WhatsAppResponse;

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Meta WhatsApp request failed (${response.status}): ${details}`);
  }
};

export const requestOtp = async (req: Request, res: ExpressResponse): Promise<void> => {
  const phone = normalizePhone(req.body.phoneNumber ?? req.body.phone);
  if (!phone) {
    res.status(400).json({ message: 'phoneNumber must be a 10-digit Indian number (e.g. 9898038051) or international format (e.g. +919898038051)' });
    return;
  }

  try {
    const otp = env.otpDeliveryEnabled ? randomInt(100000, 1000000).toString() : '123456';
    await OtpChallenge.deleteMany({ phone });
    await OtpChallenge.create({ phone, codeHash: hashOtp(otp), expiresAt: new Date(Date.now() + OTP_TTL_MS) });
    if (env.otpDeliveryEnabled) {
      await sendWhatsAppOtp(phone, otp);
    }
    const responseBody: Record<string, unknown> = {
      message: env.otpDeliveryEnabled ? 'OTP sent successfully' : 'OTP generated successfully',
      expiresInSeconds: OTP_TTL_MS / 1000,
    };
    // In dev mode expose the static OTP so any phone number can be tested without guessing.
    // This field is NEVER present when real delivery is enabled.
    if (!env.otpDeliveryEnabled) {
      responseBody.devOtp = otp;
    }
    res.status(200).json(responseBody);
  } catch (error) {
    await OtpChallenge.deleteMany({ phone }).catch(() => undefined);
    failed(res, 'Failed to send OTP', error);
  }
};

export const verifyOtp = async (req: Request, res: ExpressResponse): Promise<void> => {
  const phone = normalizePhone(req.body.phoneNumber ?? req.body.phone);
  const otp = typeof req.body.otp === 'string' ? req.body.otp.trim() : '';
  if (!phone || !/^\d{6}$/.test(otp)) {
    res.status(400).json({ message: 'phoneNumber and a 6-digit otp are required' });
    return;
  }

  try {
    const challenge = await OtpChallenge.findOne({ phone });
    if (!challenge || challenge.expiresAt.getTime() <= Date.now() || challenge.attempts >= MAX_OTP_ATTEMPTS) {
      res.status(401).json({ message: 'Invalid or expired OTP' });
      return;
    }

    challenge.attempts += 1;
    if (hashOtp(otp) !== challenge.codeHash) {
      await challenge.save();
      res.status(401).json({ message: 'Invalid OTP' });
      return;
    }

    await OtpChallenge.deleteOne({ _id: challenge._id });

    // Use atomic upsert to avoid E11000 duplicate-key errors when the phone
    // document already exists (e.g. from a previous partial registration or
    // a concurrent request hitting the unique phone index).
    const user = await User.findOneAndUpdate(
      { phone },
      {
        $setOnInsert: {
          phone,
          firstName: null,
          lastName: null,
          age: null,
          gender: null,
          role: 'PATIENT',
          profileCompleted: false,
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );

    // Older builds created OTP users with placeholder names "Mobile" / "User".
    if (!user.profileCompleted && user.firstName === 'Mobile' && user.lastName === 'User') {
      user.firstName = null;
      user.lastName = null;
      await user.save();
    }

    if (!user.isActive) {
      res.status(403).json({ message: 'User account is inactive' });
      return;
    }

    res.status(200).json(authResponse(user));
  } catch (error) {
    failed(res, 'OTP verification failed', error);
  }
};

export const refresh = async (req: Request, res: ExpressResponse): Promise<void> => {
  const refreshToken = typeof req.body.refreshToken === 'string' ? req.body.refreshToken : '';
  if (!refreshToken) {
    res.status(400).json({ message: 'refreshToken is required' });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, env.jwtSecret, { algorithms: ['HS256'] });
    if (typeof decoded === 'string' || decoded.type !== 'refresh' || typeof decoded.id !== 'string') {
      res.status(401).json({ message: 'Invalid refresh token' });
      return;
    }
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      res.status(401).json({ message: 'Invalid refresh token' });
      return;
    }
    res.status(200).json({ accessToken: generateToken(user._id.toString(), user.role, user.organizationId?.toString()) });
  } catch {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

export const checkMobileProfile = async (req: AuthRequest, res: ExpressResponse): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id).select('-passwordHash').lean();
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json({ profileCompleted: user.profileCompleted, user: publicUser(user) });
  } catch (error) {
    failed(res, 'Failed to check profile', error);
  }
};

// ─────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────
export const register = async (req: Request, res: ExpressResponse): Promise<void> => {
  try {
    const { age, gender } = req.body;
    const firstName = typeof req.body.firstName === 'string' ? req.body.firstName.trim() : '';
    const lastName = typeof req.body.lastName === 'string' ? req.body.lastName.trim() : '';
    if (!firstName || !lastName) {
      res.status(400).json({ message: 'firstName and lastName are required' });
      return;
    }
    const rawPhone = req.body.phoneNumber ?? req.body.phone;
    const email = typeof req.body.email === 'string' && req.body.email.trim()
      ? req.body.email.trim().toLowerCase()
      : undefined;

    // `role` and `organizationId` are deliberately NOT read from the body.
    // This endpoint is unauthenticated, so honouring them let any caller mint
    // themselves a PLATFORM_ADMIN token, or attach to an arbitrary tenant.
    // Privileged accounts are created through POST /api/users by an existing
    // admin; the first PLATFORM_ADMIN comes from scripts/create-platform-admin.ts.

    const phone = rawPhone ? normalizePhone(rawPhone) ?? undefined : undefined;
    if (rawPhone && !phone) {
      res.status(400).json({ message: 'phoneNumber must be a 10-digit Indian number (e.g. 9898038051) or international format (e.g. +919898038051)' });
      return;
    }

    // Mobile OTP users complete their existing profile by calling this with
    // the accessToken from verify-otp; otherwise a new patient is created.
    // A sent-but-invalid token must fail rather than fall through to creating
    // a second, phone-less user while the OTP user stays profileCompleted:false.
    const authedUserId = bearerUserId(req);
    if (authedUserId === null) {
      res.status(401).json({ message: 'Invalid or expired access token' });
      return;
    }
    const currentUser = authedUserId ? await User.findById(authedUserId) : null;
    if (authedUserId && !currentUser) {
      res.status(401).json({ message: 'Invalid or expired access token' });
      return;
    }
    if (currentUser && !currentUser.isActive) {
      res.status(403).json({ message: 'User account is inactive' });
      return;
    }

    if (!currentUser && !phone && !email) {
      res.status(400).json({ message: 'phone or email is required to register' });
      return;
    }

    if (email) {
      const emailOwner = await User.findOne({ email });
      if (emailOwner && !emailOwner._id.equals(currentUser?._id)) {
        res.status(400).json({ message: 'A user with this email already exists' });
        return;
      }
    }

    if (phone) {
      const phoneOwner = await User.findOne({ phone });
      if (phoneOwner && !phoneOwner._id.equals(currentUser?._id)) {
        res.status(400).json({ message: 'A user with this phone number already exists' });
        return;
      }
    }

    const profile = {
      firstName,
      lastName,
      age: age ?? null,
      gender: gender ?? null,
      profileCompleted: true,
    };

    let user;
    if (currentUser) {
      currentUser.set(profile);
      if (email) currentUser.email = email;
      if (phone) currentUser.phone = phone;
      user = await currentUser.save();
    } else {
      user = await User.create({
        ...profile,
        ...(email && { email }),
        ...(phone && { phone }),
        role: 'PATIENT' satisfies UserRole,
        isActive: true,
      });
    }

    res.status(currentUser ? 200 : 201).json(publicUser(user));
  } catch (error) {
    failed(res, 'Registration failed', error);
  }
};

// ─────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────
export const login = async (req: Request, res: ExpressResponse): Promise<void> => {
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
      firstName:      user.firstName ?? null,
      lastName:       user.lastName ?? null,
      age:            user.age ?? null,
      gender:         user.gender ?? null,
      email:          user.email ?? null,
      phone:          user.phone ?? null,
      role:           user.role,
      organizationId: user.organizationId,
      token: generateToken(
        user._id.toString(),
        user.role,
        user.organizationId?.toString()
      ),
    });
  } catch (error) {
    failed(res, 'Login failed', error);
  }
};

// ─────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────
export const getMe = async (req: AuthRequest, res: ExpressResponse): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id).select('-passwordHash').lean();
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    failed(res, 'Failed to fetch profile', error);
  }
};
