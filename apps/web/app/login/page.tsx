import { Card, CardContent,CardDescription, CardFooter, CardTitle, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignInButton } from "@civic/auth-web3/react";
import { getUser } from "@civic/auth-web3/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SignIn(){
    const user = await getUser();
    
    return (
        <div className="flex relative max-w-4xl mx-auto h-screen justify-center top-40">
            <div>
            <Card style={{
                width:"40rem"
            }}>
                <CardHeader>
                    <CardTitle>
                        SignIn
                    </CardTitle>
                    <CardDescription>
                        SignIn to Access
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-2 mb-4">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email"/>
                    </div>
                    <div className="flex flex-col gap-2 mb-4">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password"/>
                    </div>

                   {!user ? (<div className="flex justify-center items-center">
                            <Button variant={"secondary"}><SignInButton style={{border: "0px"}} /></Button>
                   </div>) : (
                    <div className="flex justify-center items-center">
                        <Link href={"/"}>
                        <Button>Home</Button>
                        </Link>
                    </div>
                   )}
                </CardContent>
            </Card>
            </div>
            
        </div>
    )
}