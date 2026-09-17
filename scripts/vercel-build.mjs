import { spawnSync } from "node:child_process";

process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DIRECT_URL ||
  "";

const migrateUrl =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL;

function run(command, args, extraEnv = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
  });
  return result.status ?? 1;
}

if (run("npx", ["prisma", "generate"]) !== 0) {
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.warn(
    "No DATABASE_URL / POSTGRES_URL at build time. Skipping migrate and seed.",
  );
} else {
  const migrate = run("npx", ["prisma", "migrate", "deploy"], {
    DATABASE_URL: migrateUrl,
  });
  if (migrate !== 0) {
    console.warn("prisma migrate deploy failed; continuing so the new login can ship.");
  } else {
    run("node", ["prisma/seed.mjs"]);
  }
}

if (run("npx", ["next", "build"]) !== 0) {
  process.exit(1);
}
