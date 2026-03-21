import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    service:"gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    }
})

const APP_NAME = 'Deployer-app'
const FROM = `"${APP_NAME}" <${process.env.GMAIL_USER}>`
const APP_URL = process.env.NEXT_PUBLIC_APP_URL

async function sendEmail(to: string, subject: string, html: string) {
    await transporter.sendMail({
        from: FROM,
        to,
        subject,
        html
    })
}

export async function sendVerificationEmail(email: string, token: string) {
    const verifyUrl = `${APP_URL}/api/auth/verify?token=${token}`

    await sendEmail(
        email,
        `Verify your ${APP_NAME} account`,
        `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to ${APP_NAME}!</h2>
            <p>Click the button below to verify your email address.</p>
            <p>This link expires in <strong>24 hours</strong>.</p>
            <a
                href="${verifyUrl}"
                style="
                    display: inline-block;
                    background: #000;
                    color: #fff;
                    padding: 12px 24px;
                    border-radius: 6px;
                    text-decoration: none;
                    margin: 16px 0;
                "
            >
                Verify Email
            </a>
            <p style="color: #666; font-size: 14px;">
                If you didn't create an account you can safely ignore this email.
            </p>
            <p style="color: #666; font-size: 14px;">
                Or copy this link: ${verifyUrl}
            </p>
        </div>
        `
    )
}

export async function sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${APP_URL}/reset-password?token=${token}`

    await sendEmail(
        email,
        `Reset your ${APP_NAME} password`,
        `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Reset your password</h2>
            <p>Someone requested a password reset for your account.</p>
            <p>This link expires in <strong>1 hour</strong>.</p>
            
                href="${resetUrl}"
                style="
                    display: inline-block;
                    background: #000;
                    color: #fff;
                    padding: 12px 24px;
                    border-radius: 6px;
                    text-decoration: none;
                    margin: 16px 0;
                "
            >
                Reset Password
            </a>
            <p style="color: #666; font-size: 14px;">
                If you didn't request this you can safely ignore this email.
                Your password will not be changed.
            </p>
            <p style="color: #666; font-size: 14px;">
                Or copy this link: ${resetUrl}
            </p>
        </div>
        `
    )
}