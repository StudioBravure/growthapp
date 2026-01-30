'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const returnTo = formData.get('returnTo') as string

    // Anti-timing attack delay (500-1000ms)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 500));

    // Check allowed emails before attempting login (Fast fail)
    const allowedEmails = process.env.ALLOWED_EMAILS?.split(',').map(e => e.trim()) || []
    if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
        console.warn(`[Security] Blocked unauthorized login attempt for: ${email}`)
        redirect(`/login?error=${encodeURIComponent('Credenciais inválidas ou acesso não autorizado')}`)
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        console.warn(`[Security] Login failed for: ${email}`, error.message)
        redirect(`/login?error=${encodeURIComponent('Credenciais inválidas ou acesso não autorizado')}`)
    }

    revalidatePath('/', 'layout')
    redirect(returnTo || '/')
}



export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            },
        },
    })

    if (error) {
        redirect(`/signup?error=${encodeURIComponent(error.message)}`)
    }

    // Check if email confirmation is required
    if (data.user && !data.session) {
        redirect('/login?message=Check your email to confirm your account')
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function forgotPassword(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
    })

    if (error) {
        // Log error internally but show generic success to prevent email enumeration
        console.warn(`[Security] Password reset failed for: ${email}`, error.message)
    }

    redirect('/forgot-password?message=Check your email for the password reset link')
}

export async function resetPassword(formData: FormData) {
    const supabase = await createClient()
    const password = formData.get('password') as string

    const { error } = await supabase.auth.updateUser({
        password,
    })

    if (error) {
        redirect(`/reset-password?error=${encodeURIComponent(error.message)}`)
    }

    redirect('/login?message=Password updated successfully')
}
