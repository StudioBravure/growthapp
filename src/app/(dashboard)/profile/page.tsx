'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { Loader2, User as UserIcon } from 'lucide-react'

type Profile = {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    created_at: string
    updated_at: string
}

export default function ProfilePage() {
    const { user } = useAuth()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [fullName, setFullName] = useState('')
    const supabase = createClient()

    useEffect(() => {
        if (user) {
            loadProfile()
        }
    }, [user])

    async function loadProfile() {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user!.id)
                .single()

            if (error) throw error

            setProfile(data)
            setFullName(data.full_name || '')
        } catch (error: any) {
            console.error('Error loading profile:', error)
            toast.error('Erro ao carregar perfil')
        } finally {
            setLoading(false)
        }
    }

    async function updateProfile() {
        setSaving(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: fullName })
                .eq('id', user!.id)

            if (error) throw error

            toast.success('Perfil atualizado com sucesso!')
            loadProfile()
        } catch (error: any) {
            console.error('Error updating profile:', error)
            toast.error('Erro ao atualizar perfil')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    const initials = fullName
        ? fullName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : user?.email?.slice(0, 2).toUpperCase()

    return (
        <div className="container max-w-2xl py-8">
            <Card>
                <CardHeader>
                    <CardTitle>Perfil do Usuário</CardTitle>
                    <CardDescription>
                        Gerencie suas informações pessoais
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20 border-2 border-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-2xl">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-medium">Foto de Perfil</p>
                            <p className="text-xs text-muted-foreground">
                                Em breve você poderá fazer upload de uma foto
                            </p>
                        </div>
                    </div>

                    {/* Email (read-only) */}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                            O email não pode ser alterado
                        </p>
                    </div>

                    {/* Full Name */}
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Nome Completo</Label>
                        <Input
                            id="fullName"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Seu nome completo"
                        />
                    </div>

                    {/* Account Info */}
                    <div className="space-y-2 pt-4 border-t">
                        <p className="text-sm font-medium">Informações da Conta</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Criada em</p>
                                <p>{new Date(profile?.created_at || '').toLocaleDateString('pt-BR')}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Última atualização</p>
                                <p>{new Date(profile?.updated_at || '').toLocaleDateString('pt-BR')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4">
                        <Button
                            onClick={updateProfile}
                            disabled={saving || fullName === profile?.full_name}
                        >
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Alterações
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setFullName(profile?.full_name || '')}
                            disabled={saving}
                        >
                            Cancelar
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
