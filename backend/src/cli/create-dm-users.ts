import { prisma } from '../config/database.js';
import { hashPassword } from '../utils/password.js';
import { UserRole } from '@prisma/client';

const DM_USERS = [
  { username: 'cheesecake', email: 'cheesecake@ferzendervarli.com', password: 'Cheesecake123!' },
  { username: 'sansebastian', email: 'sansebastian@ferzendervarli.com', password: 'Sansebastian123!' },
];

async function main(): Promise<void> {
  console.log('\n=== Creating DM Users ===\n');

  for (const userInfo of DM_USERS) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ username: userInfo.username }, { email: userInfo.email }],
        },
      });

      if (existingUser) {
        console.log(`User ${userInfo.username} already exists, skipping...`);
        continue;
      }

      // Hash password and create user
      const passwordHash = await hashPassword(userInfo.password);

      const user = await prisma.user.create({
        data: {
          username: userInfo.username,
          email: userInfo.email,
          passwordHash,
          role: UserRole.DM_USER,
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      console.log(`Created user: ${user.username} (${user.role})`);
    } catch (error) {
      console.error(`Error creating user ${userInfo.username}:`, error);
    }
  }

  console.log('\nDone!\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
