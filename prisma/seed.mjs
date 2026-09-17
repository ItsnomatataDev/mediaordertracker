import { randomBytes, randomUUID, scrypt } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const scryptConfig = {
  N: 16384,
  r: 16,
  p: 1,
  dkLen: 64,
};

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    scrypt(
      password.normalize("NFKC"),
      salt,
      scryptConfig.dkLen,
      {
        N: scryptConfig.N,
        r: scryptConfig.r,
        p: scryptConfig.p,
        maxmem: 128 * scryptConfig.N * scryptConfig.r * 2,
      },
      (err, key) => {
        if (err) reject(err);
        else resolve(`${salt}:${key.toString("hex")}`);
      },
    );
  });
}

async function main() {
  const email = required("BOOTSTRAP_ADMIN_EMAIL").toLowerCase().trim();
  const password = required("BOOTSTRAP_ADMIN_PASSWORD");
  const name = process.env.BOOTSTRAP_ADMIN_NAME || "Thando";

  if (password.length < 12) {
    throw new Error("BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters");
  }

  const hashed = await hashPassword(password);
  const now = new Date();

  let user =
    (await prisma.user.findUnique({ where: { email } })) ||
    (await prisma.user.findFirst({
      where: { role: "admin" },
      orderBy: { createdAt: "asc" },
    }));

  if (!user) {
    const id = randomUUID();
    user = await prisma.user.create({
      data: {
        id,
        name,
        email,
        emailVerified: true,
        role: "admin",
        createdAt: now,
        updatedAt: now,
      },
    });
    console.log(`Created admin ${email}`);
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        email,
        name,
        role: "admin",
        emailVerified: true,
        updatedAt: now,
      },
    });
    console.log(`Synced admin ${email}`);
  }

  const account = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
  });

  if (account) {
    await prisma.account.update({
      where: { id: account.id },
      data: { password: hashed, updatedAt: now },
    });
  } else {
    await prisma.account.create({
      data: {
        id: randomUUID(),
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: hashed,
        createdAt: now,
        updatedAt: now,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
