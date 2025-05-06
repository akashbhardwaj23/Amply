import { Card, CardContent,CardDescription, CardFooter, CardTitle, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignIn(){
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
                </CardContent>
            </Card>
            </div>
            
        </div>
    )
}