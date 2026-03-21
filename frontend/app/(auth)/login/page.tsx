'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import axios from 'axios'
import { loginSchema, type LoginInput } from '@/lib/validations'
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

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const message = searchParams.get('message')
    const urlError = searchParams.get('error')

    const messageMap: Record<string, string> = {
        'verified': 'Email verified successfully! You can now log in.',
        'already-verified': 'Your email is already verified. Please log in.',
    }

    const errorMap: Record<string, string> = {
        'invalid-token': 'Invalid or expired verification link. Please register again.',
        'token-expired': 'Verification link has expired. Please register again.',
        'something-went-wrong': 'Something went wrong. Please try again.',
    }

    const {
        register,
        handleSubmit,
        formState:{errors},
    } = useForm<LoginInput>({
        resolver:zodResolver(loginSchema)
    })

    async function onSubmit(data:LoginInput){
        setIsLoading(true);
        setError(null);
        try {
            await axios.post('/api/auth/login',data);
            router.push('/dashboard');
            router.refresh();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.error ?? 'Something went wrong.')
            } else {
                setError('Something went wrong. Please try again.')
            }
        } finally {
            setIsLoading(false)
        }
    }
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Welcome back</CardTitle>
                    <CardDescription>
                        Sign in to your account
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                        {/* success message from verify route */}
                        {message && messageMap[message] && (
                            <div className="bg-green-500/10 text-green-600 dark:text-green-400 text-sm px-4 py-3 rounded-lg">
                                {messageMap[message]}
                            </div>
                        )}

                        {/* error from verify route or login */}
                        {(urlError || error) && (
                            <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg">
                                {urlError ? errorMap[urlError] : error}
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

                        {/* password */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link
                                    href="/forgot-password"
                                    className="text-sm text-muted-foreground hover:text-foreground"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                    {...register('password')}
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
                                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</>
                                : 'Sign in'
                            }
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="justify-center">
                    <p className="text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Link
                            href="/register"
                            className="text-foreground font-medium hover:underline"
                        >
                            Create one
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}