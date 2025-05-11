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

export default async function SignIn() {
  const user = await getUser();

  if (user) {
    redirect('/');
  }

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
