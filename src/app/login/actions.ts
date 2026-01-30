'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const returnTo = formData.get('returnTo') as string

    // Check allowed emails before attempting login (Fast fail)
    const allowedEmails = process.env.ALLOWED_EMAILS?.split(',').map(e => e.trim()) || []
    if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
        redirect(`/login?error=${encodeURIComponent('Acesso não autorizado para este e-mail.')}`)
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/', 'layout')
    redirect(returnTo || '/')
}

export async function signInWithGoogle(returnTo?: string) {
    const supabase = await createClient()
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${origin}/auth/callback?returnTo=${returnTo || '/'}`,
        },
    })

    if (error) {
        redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    if (data.url) {
        redirect(data.url)
    }
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
        redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`)
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
