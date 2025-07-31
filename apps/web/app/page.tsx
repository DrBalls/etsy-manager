import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <h1 className="text-4xl font-bold">Etsy Manager</h1>
        <p className="text-xl text-muted-foreground">
          Manage your Etsy shop with ease
        </p>
        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/auth/signin">Sign In</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth/signup">Create Account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}