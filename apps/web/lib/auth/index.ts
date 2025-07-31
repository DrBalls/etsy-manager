import { getServerSession } from 'next-auth/next';
import { authOptions } from './config';
import { redirect } from 'next/navigation';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/signin');
  }
  
  return user;
}

export { authOptions } from './config';
export { hashPassword, verifyPassword } from './utils';