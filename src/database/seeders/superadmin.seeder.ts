import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { connect, model, disconnect } from 'mongoose';
import {
  ADMIN_DEFAULT_PERMISSIONS,
  User,
  UserRole,
  UserSchema,
} from '../../users/entities/user.entity';

async function seedSuperAdmin() {
  const mongodbUri = process.env.MONGODB_URI?.trim();
  if (!mongodbUri) {
    throw new Error('MONGODB_URI is required to run superadmin seeder');
  }

  await connect(mongodbUri);
  const UserModel = model<User>(User.name, UserSchema);

  try {
    const email =
      process.env.SUPERADMIN_EMAIL?.trim().toLowerCase() ??
      'tedxdamascus';
    const password = process.env.SUPERADMIN_PASSWORD?.trim() ?? '12345678';

    const existing = await UserModel.findOne({ email }).lean();
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existing) {
      await UserModel.updateOne(
        { _id: existing._id },
        {
          $set: {
            role: UserRole.SUPERADMIN,
            is_active: true,
            password: hashedPassword,
            permissions: ADMIN_DEFAULT_PERMISSIONS,
          },
        },
      );
      console.log(`Superadmin updated: ${email}`);
      return;
    }

    await UserModel.create({
      email,
      password: hashedPassword,
      role: UserRole.SUPERADMIN,
      is_active: true,
      permissions: ADMIN_DEFAULT_PERMISSIONS,
    });

    console.log(`Superadmin created: ${email}`);
  } finally {
    await disconnect();
  }
}

void seedSuperAdmin();
