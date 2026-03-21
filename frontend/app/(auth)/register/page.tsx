"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import axios from 'axios'
import { registerSchema, type RegisterInput, checkPasswordStrength } from '@/lib/validations'
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
// import { Toast } from 'radix-ui'
import { toast } from "sonner"

const strengthColors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-blue-500',
    'bg-green-500',
]

const strengthLabels = [
    'Very weak',
    'Weak',
    'Fair',
    'Good',
    'Strong',
]

export default function RegisterPage(){
    const router = useRouter();
    const [showPassword,setShowPassword] = useState(false);
    const [isLoading,setIsLoading] = useState(false);
    const [error,setError] = useState<string|null>(null);
    const [success,setSuccess] = useState(false);
    const [passwordValue,setPasswordValue] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
    })

    const passwordStrength = passwordValue.length > 0
        ? checkPasswordStrength(passwordValue)
        : null
    
    async function onSubmit(data:RegisterInput){
        setIsLoading(true);
        setError(null);
        try {
            await axios.post('/api/auth/register',data);
            setSuccess(true);
            // toast("Event created");
        } catch (err:any) {
            if(!axios.isAxiosError(err)){
                setError(err.response?.data?.error??"something went wrong")
            }else{
                setError("Something went wrong. Please try again");
            }
        }
        finally{
            setIsLoading(true)
        }
    }
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle>Check your email!</CardTitle>
                        <CardDescription>
                            We sent a verification link to your email address.
                            Please verify your account before logging in.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => router.push('/login')}
                        >
                            Go to Login
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Create an account</CardTitle>
                    <CardDescription>
                        Enter your details below to get started
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                        {error && (
                            <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* email */}
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

                        {/* username */}
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Jhon_dev"
                                disabled={isLoading}
                                {...register('username')}
                            />
                            {errors.username && (
                                <p className="text-destructive text-sm">
                                    {errors.username.message}
                                </p>
                            )}
                        </div>

                        {/* password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                    {...register('password', {
                                        onChange: (e) => setPasswordValue(e.target.value)
                                    })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword
                                        ? <EyeOff className="w-4 h-4" />
                                        : <Eye className="w-4 h-4" />
                                    }
                                </button>
                            </div>

                            {/* strength meter */}
                            {passwordStrength && (
                                <div className="space-y-1">
                                    <div className="flex gap-1">
                                        {[0, 1, 2, 3, 4].map((i) => (
                                            <div
                                                key={i}
                                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                                    i <= passwordStrength.score
                                                        ? strengthColors[passwordStrength.score]
                                                        : 'bg-muted'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className={`text-xs font-medium ${
                                            passwordStrength.score <= 1
                                                ? 'text-red-500'
                                                : passwordStrength.score === 2
                                                ? 'text-yellow-500'
                                                : passwordStrength.score === 3
                                                ? 'text-blue-500'
                                                : 'text-green-500'
                                        }`}>
                                            {strengthLabels[passwordStrength.score]}
                                        </p>
                                    </div>
                                    {passwordStrength.suggestions.length > 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            {passwordStrength.suggestions[0]}
                                        </p>
                                    )}
                                </div>
                            )}

                            {errors.password && (
                                <p className="text-destructive text-sm">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading
                                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</>
                                : 'Create account'
                            }
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="justify-center">
                    <p className="text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link
                            href="/login"
                            className="text-foreground font-medium hover:underline"
                        >
                            Sign in
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}