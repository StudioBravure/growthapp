import { NextResponse } from 'next/server'

export function applySecurityHeaders(response: NextResponse): NextResponse {
    const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://*.supabase.co;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`

    response.headers.set('Content-Security-Policy', cspHeader.replace(/\s{2,}/g, ' ').trim())
    response.headers.set('X-Frame-Options', 'DENY') // Anti-Clickjacking
    response.headers.set('X-Content-Type-Options', 'nosniff') // Prevent MIME sniffing
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), browsing-topics=()')
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload') // HSTS

    return response
}
