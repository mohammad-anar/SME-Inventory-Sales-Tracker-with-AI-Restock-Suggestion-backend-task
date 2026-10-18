import bcrypt from "bcryptjs";
import env from "../config/env.js";
import prisma from "../config/prisma.js";
import { Role } from "@prisma/client";

export const seedSuperAdmin = async () => {
  if (!env.admin.email || !env.admin.password) {
    return;
  }

  const normalizedEmail = env.admin.email.trim().toLowerCase();
  console.log("Checking for Admin with email:", normalizedEmail);

  const isExist = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
    },
  });

  if (!isExist) {
    const hashedPassword = await bcrypt.hash(
      env.admin.password,
      env.bcrypt_salt_round || 10,
    );

    await prisma.user.create({
      data: {
        name: env.admin.name || "Super Admin",
        email: normalizedEmail,
        phone: env.admin.phone || null,
        passwordHash: hashedPassword,
        avatar: env.admin.avatar || null,
        role: Role.ADMIN,
        isActive: true,
      },
    });
    console.log("Super admin created successfully.");
  } else {
    console.log("Super admin already exists.");
  }
};

export default seedSuperAdmin;
