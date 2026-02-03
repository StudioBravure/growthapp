import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    const client = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );

    // MOCK USER FOR DEVELOPMENT ("Libera direto")
    if (process.env.NODE_ENV === 'development') {
        const originalGetUser = client.auth.getUser.bind(client.auth);
        client.auth.getUser = async () => {
            const { data, error } = await originalGetUser();
            if (data.user) return { data, error };

            // Return mock user if no session
            return {
                data: {
                    user: {
                        id: 'dev-mock-user-id',
                        email: 'developer@local.com',
                        aud: 'authenticated',
                        role: 'authenticated',
                        app_metadata: {},
                        user_metadata: {},
                        created_at: new Date().toISOString(),
                    }
                },
                error: null
            } as any;
        };
    }

    return client;
}
