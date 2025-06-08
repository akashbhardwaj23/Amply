import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  CardHeader,
} from "@/components/ui/card";
import { SignInButton } from "@civic/auth-web3/react";
import { getUser } from "@civic/auth-web3/nextjs";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Suspense } from "react";
import Image from "next/image";

export default function SignIn() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex justify-center p-10 md:p-20">
        <Suspense fallback={<div>Loading</div>}>
          <SignInComponent />
        </Suspense>
      </main>
    </div>
  );

  async function SignInComponent() {
    const user = await getUser();

    if (user) {
      redirect("/");
    }

    return (
      <div className="w-full max-w-4xl h-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome to Amply
          </h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to access your EV charging dashboard
          </p>
        </div>


        <Card className="border-2 shadow-lg p-10 bg-[radial-gradient(ellipse_at_bottom_left,_#e11d4b_0%,_transparent_5%),radial-gradient(ellipse_at_bottom_right,_#e11d4b_0%,_transparent_5%)] bg-no-repeat bg-size-[50px_50px] animate-gradient-pluse from-primary">
          <div className="flex flex-col md:grid md:grid-cols-4">
            <CardContent className="col-span-2">
             <Image src={'/logo.jpg'} alt="logo" width={500} height={500} className="w-30 h-30 md:w-60 md:h-60 image relative object-cover rounded-[12px] bg-[radial-gradient(center at 100%,_#e11d4b_100%)] shadow-[#e11d4b_0px_4px_24px_0px]" />
            </CardContent>
            <div className="col-span-2">
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-4xl">Sign in</CardTitle>
                <CardDescription>
                  Choose your preferred authentication method
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {/* <Button
                variant="outline"
                className="w-full h-12 flex items-center justify-center gap-3 border-2"
              > */}
                <SignInButton
                  style={{
                    borderRadius: "5px",
                    border: "1px solid #27272a",
                    background: "linear-gradient(to bottom right, #e11d4b, transparent)",
                    width: "100%",
                  }}
                />
                {/* </Button> */}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or
                    </span>
                  </div>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  <p>More authentication options coming soon</p>
                </div>
              </CardContent>
            </div>
          </div>
        </Card>
      </div>
    );
  }
}
