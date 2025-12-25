import readline from 'readline';
import { prisma } from '../config/database.js';
import { hashPassword } from '../utils/password.js';
import { createUserSchema } from '../schemas/auth.schema.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

function promptPassword(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.setRawMode?.(true);
    process.stdin.resume();

    let password = '';
    process.stdin.on('data', function handler(char) {
      const charStr = char.toString();

      if (charStr === '\n' || charStr === '\r' || charStr === '\u0004') {
        process.stdin.setRawMode?.(false);
        process.stdin.removeListener('data', handler);
        console.log();
        resolve(password);
      } else if (charStr === '\u0003') {
        // Ctrl+C
        process.exit();
      } else if (charStr === '\u007F' || charStr === '\b') {
        // Backspace
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else {
        password += charStr;
        process.stdout.write('*');
      }
    });
  });
}

async function main(): Promise<void> {
  console.log('\n=== AI Tools - Create User ===\n');

  try {
    // Get user input
    const username = await prompt('Username: ');
    const email = await prompt('Email: ');
    const password = await promptPassword('Password: ');
    const confirmPassword = await promptPassword('Confirm Password: ');

    // Validate passwords match
    if (password !== confirmPassword) {
      console.error('\nError: Passwords do not match');
      process.exit(1);
    }

    // Validate input
    const result = createUserSchema.safeParse({ username, email, password });
    if (!result.success) {
      console.error('\nValidation errors:');
      result.error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      console.error('\nError: Username or email already exists');
      process.exit(1);
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });

    console.log('\n✓ User created successfully!\n');
    console.log('  ID:', user.id);
    console.log('  Username:', user.username);
    console.log('  Email:', user.email);
    console.log('  Created:', user.createdAt.toISOString());
    console.log();
  } catch (error) {
    console.error('\nError creating user:', error);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();
