import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  CardHeader,
} from '@/components/ui/card';
import { SignInButton } from '@civic/auth-web3/react';
import { getUser } from '@civic/auth-web3/nextjs';
import { Button } from '@/components/ui/button';
import { redirect } from 'next/navigation';
import { Separator } from '@/components/ui/separator';

export default async function SignIn() {
  const user = await getUser();

  if (user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Welcome to ChargeSol</h1>
            <p className="mt-2 text-muted-foreground">Sign in to access your EV charging dashboard</p>
          </div>

          <Card className="border-2">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl">Sign in</CardTitle>
              <CardDescription>Choose your preferred authentication method</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button
                variant="outline"
                className="w-full h-12 flex items-center justify-center gap-3 border-2"
              >
                <SignInButton style={{ border: '0px' }} />
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>More authentication options coming soon</p>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  )


  return (
    <div className="flex relative max-w-4xl mx-auto h-screen justify-center top-40">
      <div>
        <Card
          style={{
            width: '20rem',
          }}
        >
          <CardHeader>
            <CardTitle>SignIn</CardTitle>
            <CardDescription>SignIn to Access Amply</CardDescription>
          </CardHeader>
          <CardContent>
            {/* <div className="flex flex-col gap-2 mb-4">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email"/>
                    </div>
                    <div className="flex flex-col gap-2 mb-4">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password"/>
                    </div> */}

            {!user && (
              <div className="flex justify-center items-center">
                <Button variant={'secondary'}>
                  <SignInButton style={{ border: '0px' }} />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
