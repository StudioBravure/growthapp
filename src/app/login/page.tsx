import { login } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Zap, AlertCircle } from "lucide-react"
import Link from "next/link"

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string, error?: string, returnTo?: string }>
}) {
    const { message, error, returnTo } = await searchParams;

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Glow Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-chart-2/10 rounded-full blur-[128px] pointer-events-none" />

            <Card className="w-full max-w-md border-border bg-card/50 backdrop-blur-xl shadow-2xl relative z-10">
                <CardHeader className="space-y-1 flex flex-col items-center text-center">
                    <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center mb-4 text-primary-foreground">
                        <Zap className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Studio Bravure</CardTitle>
                    <CardDescription>
                        Entre com suas credenciais para acessar o dashboard
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="p-3 mb-4 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                    {message && (
                        <div className="p-3 mb-4 text-sm text-primary-foreground bg-primary/10 border border-primary/20 rounded-md text-center">
                            {message}
                        </div>
                    )}

                    <form action={login} className="space-y-4">
                        <input type="hidden" name="returnTo" value={returnTo || '/'} />
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                className="bg-background/50 border-input focus:border-primary/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Senha</Label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Esqueceu a senha?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                minLength={8}
                                className="bg-background/50 border-input focus:border-primary/50"
                            />
                        </div>
                        <Button type="submit" className="w-full font-semibold">
                            Entrar
                        </Button>
                    </form>


                </CardContent>
                <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground border-t pt-4">
                    <p>
                        Não tem uma conta?{' '}
                        <Link href="/signup" className="text-primary hover:underline font-medium">
                            Criar conta
                        </Link>
                    </p>
                </CardFooter>
            </Card>

            <div className="absolute bottom-4 text-[10px] text-muted-foreground opacity-50">
                Powered by Antigravity & Supabase
            </div>
        </div>
    )
}
