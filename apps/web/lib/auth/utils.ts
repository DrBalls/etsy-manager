import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth-options';
import { redirect } from 'next/navigation';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/signin');
  }
  
  return session;
}