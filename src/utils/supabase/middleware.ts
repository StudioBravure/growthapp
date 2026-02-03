import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { applySecurityHeaders } from '../security-headers'

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password', '/auth']

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    // SAFETY CHECK: If keys are still placeholders, skip auth to prevent crash
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id')) {
        console.warn('Supabase keys are missing or invalid. Skipping middleware auth check.')
        return supabaseResponse
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { pathname } = request.nextUrl

    // Check if current path is public
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))

    // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
    // creating a new Response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    // 4. Finally:
    //    return myNewResponse
    // If this is not done, you may be causing the browser and server to go out
    // of sync and terminate the user's session prematurely!

    // Get user session
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Single User / Allowed Emails check
    if (user) {
        const allowedEmails = process.env.ALLOWED_EMAILS?.split(',').map(e => e.trim()) || []
        const isAllowed = allowedEmails.length === 0 || allowedEmails.includes(user.email || '')

        if (!isAllowed) {
            await supabase.auth.signOut()
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            url.searchParams.set('error', 'Acesso não autorizado para este e-mail.')
            return applySecurityHeaders(NextResponse.redirect(url))
        }
    }

    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (user && isPublicRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return applySecurityHeaders(NextResponse.redirect(url))
    }

    // If user is not authenticated and trying to access protected routes, redirect to login
    // BYPASS: In development, allow access without login (Mock Mode support)
    if (!user && !isPublicRoute && process.env.NODE_ENV !== 'development') {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.pathname = '/login'
        // Save the original URL to redirect back after login
        url.searchParams.set('returnTo', pathname)
        return applySecurityHeaders(NextResponse.redirect(url))
    }

    return applySecurityHeaders(supabaseResponse)
}
