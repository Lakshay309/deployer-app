'use client';

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Loader2, ArrowLeft } from 'lucide-react'
import axios from 'axios'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/ui/card'


export default function ForgotPasswordPage(){
    const [isLoading,setIsLoading]= useState(false);
    const [error,setError] = useState<string|null>(null);
    const [success,setSuccess] = useState(false);

    const{
        register,
        handleSubmit,
        formState:{errors},
    } = useForm<ForgotPasswordInput>({
        resolver:zodResolver(forgotPasswordSchema)
    })

    const onSubmit = async (data:ForgotPasswordInput)=>{
        setIsLoading(true);
        setError(null);
        try {
            await axios.post('/api/auth/forget-password',data);
            setSuccess(true);
        } catch (err) {
            if(axios.isAxiosError(err)){
                setError(err.response?.data?.error ?? "something went wrong.");
            }else{
                setError("Something went wrong. Please try again.")
            }
        }finally{
            setIsLoading(false);
        }
    }
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle>Check your email!</CardTitle>
                        <CardDescription>
                            If an account exists with that email you will
                            receive a password reset link shortly.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Link href="/login" className="w-full">
                            <Button variant="outline" className="w-full">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to login
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Forgot password?</CardTitle>
                    <CardDescription>
                        Enter your email and we'll send you a reset link
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                        {error && (
                            <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                disabled={isLoading}
                                {...register('email')}
                            />
                            {errors.email && (
                                <p className="text-destructive text-sm">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading
                                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</>
                                : 'Send reset link'
                            }
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="justify-center">
                    <Link
                        href="/login"
                        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                        <ArrowLeft className="w-3 h-3" />
                        Back to login
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}