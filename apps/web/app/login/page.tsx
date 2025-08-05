'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  CardHeader,
} from "@/components/ui/card";
import { SignInButton, useUser } from "@civic/auth-web3/react";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Suspense } from "react";
import Image from "next/image";
import { Loader } from "@/components/ui/loader";
import { useTheme } from "next-themes";

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

function SignInComponent() {
    const {user, isLoading} = useUser();
    const { resolvedTheme } = useTheme()

    if (user) {
      redirect("/");
    }

    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-screen">
          <Loader />
        </div>
      );
    }

    return (
      <div className="w-full max-w-4xl h-full space-y-8">
        <div className="text-center">
          <h1 className="text-xl md:text-3xl font-bold tracking-tight">
            Welcome to Amply
          </h1>
          <p className="text-xs md:text-base mt-2 text-muted-foreground">
            Sign in to access your EV charging dashboard
          </p>
        </div>


        <Card className="border shadow-lg p-10 dark:bg-[oklch(14.7% 0.004 49.25)]">
          <div className="flex flex-col md:grid md:grid-cols-4">
            <CardContent className="col-span-2 flex justify-center">
             <Image src={'/logo.jpg'} alt="logo" width={500} height={500} loading="lazy" className="w-20 h-20 md:w-60 md:h-60 image relative object-cover rounded-[12px] bg-[radial-gradient(center at 100%,_#e11d4b_100%)] shadow-[#e11d4b_0px_4px_24px_0px]" />
            </CardContent>
            <div className="col-span-2">
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl md:text-4xl">Sign in</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Choose your preferred authentication method
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                
                <SignInButton
                  style={{
                    borderRadius: "5px",
                    border: resolvedTheme === "light" ?  "1px solid oklch(89.2% 0.058 10.001)" : "1px solid oklch(14.7% 0.004 49.25)",
                    background: "linear-gradient(to bottom, oklch(71.2% 0.194 13.428), oklch(81% 0.117 11.638))",
                    width: "100%",
                    color : "black"
                  }}
                />


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
