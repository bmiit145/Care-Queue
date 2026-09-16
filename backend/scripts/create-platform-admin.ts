/**
 * Creates (or repairs) a PLATFORM_ADMIN account.
 *
 * POST /api/auth/register no longer accepts a `role`, so this is the supported
 * way to bootstrap the first administrator. Every other privileged account is
 * created from the dashboard via POST /api/users.
 *
 * Usage:
 *   pnpm admin:create -- --email=admin@example.com --password='<strong>' \
 *     --firstName=Ada --lastName=Lovelace
 *
 * Re-running for an existing email promotes that user to PLATFORM_ADMIN and
 * reactivates them, which is also the recovery path if an admin is locked out.
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../src/config/env';
import { User } from '../src/modules/users/user.model';

const arg = (name: string): string | undefined => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.slice(`--${name}=`.length);
};

const run = async (): Promise<void> => {
  const email = arg('email')?.toLowerCase().trim();
  const password = arg('password');
  const firstName = arg('firstName') ?? 'Platform';
  const lastName = arg('lastName') ?? 'Admin';

  if (!email || !password) {
    console.error('Usage: pnpm admin:create -- --email=<email> --password=<password>');
    process.exit(1);
  }

  if (password.length < 12) {
    console.error('Refusing to create a platform administrator with a password under 12 characters.');
    process.exit(1);
  }

  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10_000 });

  const passwordHash = await bcrypt.hash(password, await bcrypt.genSalt(12));

  const existing = await User.findOne({ email });

  if (existing) {
    existing.role = 'PLATFORM_ADMIN';
    existing.passwordHash = passwordHash;
    existing.isActive = true;
    await existing.save();
    console.log(`Promoted existing user ${email} to PLATFORM_ADMIN and reset their password.`);
  } else {
    await User.create({
      firstName,
      lastName,
      email,
      passwordHash,
      role: 'PLATFORM_ADMIN',
      isActive: true,
    });
    console.log(`Created PLATFORM_ADMIN ${email}.`);
  }

  await mongoose.connection.close(false);
};

void run().catch((error: unknown) => {
  console.error('Failed to create platform administrator:', error);
  process.exitCode = 1;
});
