import leoProfanity from 'leo-profanity'
import { z } from 'zod'
import zxcvbn from 'zxcvbn'


leoProfanity.add([
    'admin', 'root', 'api', 'www', 'mail', 'smtp','deployer', 'system', 'support', 'help', 'billing',
    'login', 'register', 'dashboard', 'settings', 'profile','null', 'undefined', 'test', 'demo', 'dev', 'prod'
])

export type checkPasswordStrengthProp={
    score:number,
    label:string,
    suggestions:string[]
}


export function checkPasswordStrength(password:string):checkPasswordStrengthProp{
    let result ;
    if(password.length>75){
        result = zxcvbn(password.slice(0,75));
    }else{
        result = zxcvbn(password);
    }
    const labels = ['very weak', 'weak', 'fair', 'good', 'strong']
    return {
        score: result.score,
        label: labels[result.score],
        suggestions: result.feedback.suggestions
    }
}

export const usernameSchema = z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(
        /^[a-z0-9_]+$/,
        'Username can only contain lowercase letters, numbers and underscores'
    )
    .refine(val => !val.startsWith('_') && !val.endsWith('_'), {
        message: 'Username cannot start or end with underscore'
    })
    .refine(val => !leoProfanity.check(val), {
        message: 'Username is not allowed'
    })


export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters')  // bcrypt limit
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .refine(val => checkPasswordStrength(val).score >= 2, {
        message: 'Password is too weak — try adding numbers, symbols or more words'
    })

export const emailSchema = z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address')

export const projectNameSchema = z
    .string()
    .trim()
    .min(3, 'Project name must be at least 3 characters')
    .max(30, 'Project name must be at most 30 characters')
    .regex(
        /^[a-z0-9-]+$/,
        'Project name can only contain lowercase letters, numbers and hyphens'
    )
    .refine(val => !val.startsWith('-') && !val.endsWith('-'), {
        message: 'Project name cannot start or end with a hyphen'
    })
    .refine(val => !val.includes('--'), {
        message: 'Project name cannot contain consecutive hyphens'
    })
    .refine(val => !leoProfanity.check(val), {
        message: 'Project name is not allowed'
    })


export const repoUrlSchema = z
    .string()
    .trim()
    .regex(
        /^https:\/\/(github\.com|gitlab\.com)\/[\w.\-]+\/[\w.\-]+(\.git)?$/,
        'Only public GitHub and GitLab HTTPS URLs are allowed'
    )

export const registerSchema = z.object({
    email:    emailSchema,
    username: usernameSchema,
    password: passwordSchema
})

export const loginSchema = z.object({
    email:    emailSchema,
    password: z.string().min(1, 'Password is required'),
})

export const newProjectSchema = z.object({
    name:    projectNameSchema,
    repoUrl: repoUrlSchema,
})

export const forgotPasswordSchema = z.object({
    email: emailSchema,
})

export const resetPasswordSchema = z.object({
    password: passwordSchema,
    confirmPassword:z.string(),
}).refine(data=>data.password === data.confirmPassword,{
    message:'Passwords do not match',
    path:['confirmPassword']
})

export type RegisterInput    = z.infer<typeof registerSchema>
export type LoginInput       = z.infer<typeof loginSchema>
export type NewProjectInput  = z.infer<typeof newProjectSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>