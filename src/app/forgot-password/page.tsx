import { forgotPassword } from '../login/actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Mail, AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default async function ForgotPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string, message?: string }>
}) {
    const { error, message } = await searchParams;

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Glow Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-chart-2/10 rounded-full blur-[128px] pointer-events-none" />

            <Card className="w-full max-w-md border-border bg-card/50 backdrop-blur-xl shadow-2xl relative z-10">
                <CardHeader className="space-y-1 flex flex-col items-center text-center">
                    <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center mb-4 text-primary-foreground">
                        <Mail className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Esqueceu a senha?</CardTitle>
                    <CardDescription>
                        Digite seu email para receber um link de recuperação
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
                        <div className="p-3 mb-4 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>{message}</span>
                        </div>
                    )}

                    <form className="space-y-4">
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
                        <Button formAction={forgotPassword} className="w-full font-semibold">
                            Enviar Link de Recuperação
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground border-t pt-4">
                    <p>
                        Lembrou a senha?{' '}
                        <Link href="/login" className="text-primary hover:underline font-medium">
                            Voltar para login
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
