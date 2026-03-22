"use client";

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import axios from 'axios'
import { resetPasswordSchema, type ResetPasswordInput, checkPasswordStrength } from '@/lib/validations'
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

export default function ResetPasswordPage(){
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [showPassword,setShowPassword] = useState(false);
    const [showConfirm,setShowConfirm] = useState(false);
    const [isLoading,setIsLoading] = useState(false);
    const [error,setError] = useState<string|null>(null);
    const [success,setSuccess] = useState(false);
    const [passwordValue,setPasswordValue] = useState('');

    const{
        register,
        handleSubmit,
        formState:{errors}
    } = useForm<ResetPasswordInput>({
        resolver:zodResolver(resetPasswordSchema),
    })

    const passwordStrength = passwordValue.length >0 ?checkPasswordStrength(passwordValue):null;

    async function onSubmit(data:ResetPasswordInput){
        setIsLoading(true);
        setError(null);
        try {
            await axios.post(`/api/auth/reset-password?token=${token}`,data);
            setSuccess(true);
        } catch (err) {
            if(axios.isAxiosError(err)){
                setError(err.response?.data?.error ?? "SomeThing went wrong");
            }else{
                setError("Something went wrong. Please try again");
            }
        }
        finally{
            setIsLoading(false);
        }
    }


    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle>Invalid reset link</CardTitle>
                        <CardDescription>
                            This password reset link is invalid or has expired.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Link href="/forgot-password" className="w-full">
                            <Button variant="outline" className="w-full">
                                Request a new link
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle>Password reset!</CardTitle>
                        <CardDescription>
                            Your password has been reset successfully.
                            You can now log in with your new password.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button
                            className="w-full"
                            onClick={() => router.push('/login')}
                        >
                            Go to login
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
                    <CardTitle className="text-2xl">Reset password</CardTitle>
                    <CardDescription>
                        Enter your new password below
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                        {error && (
                            <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* new password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">New password</Label>
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

                        {/* confirm password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm password</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirm ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                    {...register('confirmPassword')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showConfirm
                                        ? <EyeOff className="w-4 h-4" />
                                        : <Eye className="w-4 h-4" />
                                    }
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-destructive text-sm">
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading
                                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Resetting...</>
                                : 'Reset password'
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