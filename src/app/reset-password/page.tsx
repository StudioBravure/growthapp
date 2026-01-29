import { resetPassword } from '../login/actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { KeyRound, AlertCircle } from "lucide-react"

export default async function ResetPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>
}) {
    const { error } = await searchParams;

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Glow Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-chart-2/10 rounded-full blur-[128px] pointer-events-none" />

            <Card className="w-full max-w-md border-border bg-card/50 backdrop-blur-xl shadow-2xl relative z-10">
                <CardHeader className="space-y-1 flex flex-col items-center text-center">
                    <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center mb-4 text-primary-foreground">
                        <KeyRound className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Redefinir Senha</CardTitle>
                    <CardDescription>
                        Digite sua nova senha abaixo
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="p-3 mb-4 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Nova Senha</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                minLength={8}
                                placeholder="Mínimo 8 caracteres"
                                className="bg-background/50 border-input focus:border-primary/50"
                            />
                            <p className="text-xs text-muted-foreground">
                                A senha deve ter no mínimo 8 caracteres
                            </p>
                        </div>
                        <Button formAction={resetPassword} className="w-full font-semibold">
                            Atualizar Senha
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="absolute bottom-4 text-[10px] text-muted-foreground opacity-50">
                Powered by Antigravity & Supabase
            </div>
        </div>
    )
}
