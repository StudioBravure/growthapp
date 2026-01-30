import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const returnTo = searchParams.get('returnTo') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Check email restriction again after successful OAuth exchange
            const { data: { user } } = await supabase.auth.getUser()
            const allowedEmails = process.env.ALLOWED_EMAILS?.split(',').map(e => e.trim()) || []

            if (user && allowedEmails.length > 0 && !allowedEmails.includes(user.email || '')) {
                await supabase.auth.signOut()
                return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Acesso não autorizado para este e-mail.')}`)
            }

            return NextResponse.redirect(`${origin}${returnTo}`)
        }

        // Return to login with error
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=OAuth callback failed`)
}
