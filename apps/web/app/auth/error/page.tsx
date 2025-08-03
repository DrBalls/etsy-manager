'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');

  const errorMessages: Record<string, string> = {
    Configuration: 'There is a problem with the server configuration.',
    AccessDenied: 'You do not have permission to sign in.',
    Verification: 'The sign in link is no longer valid.',
    Default: 'An error occurred during authentication.',
  };

  const message = errorMessages[error || 'Default'] || errorMessages.Default;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-2xl">Authentication Error</CardTitle>
          </div>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          If you continue to experience issues, please contact support.
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/auth/signin">Try again</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <CardTitle className="text-2xl">Authentication Error</CardTitle>
            </div>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}