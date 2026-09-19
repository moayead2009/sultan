import { hash } from '@node-rs/argon2';
import { db } from '../lib/db';

function assertPassword(password: string) {
  if (password.length < 12 || password.length > 128) {
    throw new Error('Password must be between 12 and 128 characters.');
  }
}

async function main() {
  const name = process.env.OWNER_NAME?.trim();
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const password = process.env.OWNER_PASSWORD ?? '';

  if (!name || !email) {
    throw new Error('OWNER_NAME and OWNER_EMAIL are required.');
  }
  assertPassword(password);

  const passwordHash = await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1
  });

  const owner = await db.user.upsert({
    where: { email },
    update: { name, passwordHash, role: 'OWNER', status: 'ACTIVE' },
    create: { name, email, passwordHash, role: 'OWNER', status: 'ACTIVE' }
  });

  console.log('Owner bootstrap complete for user id:', owner.id);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => db.$disconnect());
