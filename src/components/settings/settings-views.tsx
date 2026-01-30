"use client";

import { useAppStore } from "@/store/use-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, GripVertical, Plus, Trash2, X, RefreshCw, Smartphone, Mail, Cloud, CreditCard, DollarSign, Settings, FileText, ArrowDownCircle, Shield, Lock, LogOut } from "lucide-react";
import { Category, AppMode, CategorizationRule, Integration } from "@/lib/types";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { DangerousZoneSettings } from "@/components/settings/dangerous-zone";

export function PreferencesSettings() {
    const { settings, updateSettings } = useAppStore();
    const { setTheme, theme } = useTheme();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Preferências Gerais</CardTitle>
                <CardDescription>Personalize sua experiência no Studio Bravure.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label>Tema</Label>
                        <p className="text-sm text-muted-foreground">Escolha entre Claro, Escuro ou Sistema.</p>
                    </div>
                    <Select value={theme} onValueChange={setTheme}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Selecione o tema" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="light">Claro</SelectItem>
                            <SelectItem value="dark">Escuro</SelectItem>
                            <SelectItem value="system">Sistema</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label>Fuso Horário</Label>
                        <p className="text-sm text-muted-foreground">Afeta datas de vencimento e relatórios.</p>
                    </div>
                    <Select
                        value={settings.preferences.timezone}
                        onValueChange={(val) => updateSettings(s => ({ preferences: { ...s.preferences, timezone: val } }))}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                            <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                            <SelectItem value="UTC">UTC</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label>Visualização Padrão</Label>
                        <p className="text-sm text-muted-foreground">Período inicial ao abrir Dashboards.</p>
                    </div>
                    <Select
                        value={settings.preferences.defaultDateView}
                        onValueChange={(val: any) => updateSettings(s => ({ preferences: { ...s.preferences, defaultDateView: val } }))}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="WEEK">Semana</SelectItem>
                            <SelectItem value="MONTH">Mês</SelectItem>
                            <SelectItem value="3M">Trimestre</SelectItem>
                            <SelectItem value="YEAR">Ano</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
            <CardFooter>
                <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">Restaurar Padrões</Button>
            </CardFooter>
        </Card>
    );
}

export function ModesSettings() {
    const { settings, updateSettings } = useAppStore();

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Comportamento dos Modos</CardTitle>
                    <CardDescription>Como o app lida com a separação PF x PJ.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="flex items-center justify-between border p-4 rounded-lg">
                        <div className="space-y-0.5">
                            <Label className="text-base">Modo Consolidado</Label>
                            <p className="text-xs text-muted-foreground">Somar saldos de PF e PJ na visão unificada?</p>
                        </div>
                        <Select
                            value={settings.modes.consolidatedBehavior}
                            onValueChange={(val: any) => updateSettings(s => ({ modes: { ...s.modes, consolidatedBehavior: val } }))}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SUM">Somar Tudo</SelectItem>
                                <SelectItem value="SEPARATE">Separar em Abas</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between border p-4 rounded-lg">
                        <div className="space-y-0.5">
                            <Label className="text-base">Modo Inicial</Label>
                            <p className="text-xs text-muted-foreground">Qual perfil abrir ao iniciar o app?</p>
                        </div>
                        <Select
                            value={settings.modes.defaultMode}
                            onValueChange={(val: any) => updateSettings(s => ({ modes: { ...s.modes, defaultMode: val } }))}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CONSOLIDATED">Visão 360°</SelectItem>
                                <SelectItem value="PF">Pessoal (PF)</SelectItem>
                                <SelectItem value="PJ">Estúdio (PJ)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export function CategoriesSettings() {
    const { categories, addCategory, updateCategory, deleteCategory } = useAppStore();
    // Default to PF to avoid CONSOLIDATED type error
    const [activeTab, setActiveTab] = useState<AppMode>('PF');
    const [newCatName, setNewCatName] = useState('');
    const [newCatType, setNewCatType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');

    const filtered = categories.filter(c => c.mode === activeTab);

    const handleAdd = () => {
        if (!newCatName) return;
        addCategory({
            name: newCatName,
            type: newCatType,
            mode: activeTab as 'PF' | 'PJ', // Safe cast as UI constrains tabs
            color: '#888888',
            isDefault: false
        });
        setNewCatName('');
        toast.success("Categoria criada!");
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Categorias</CardTitle>
                        <CardDescription>Organize seus lançamentos.</CardDescription>
                    </div>
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AppMode)}>
                        <TabsList>
                            <TabsTrigger value="PF">Pessoal</TabsTrigger>
                            <TabsTrigger value="PJ">Empresa</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
                <div className="flex gap-2">
                    <Input
                        placeholder="Nova categoria..."
                        value={newCatName}
                        onChange={e => setNewCatName(e.target.value)}
                    />
                    <Select value={newCatType} onValueChange={(v: any) => setNewCatType(v)}>
                        <SelectTrigger className="w-[110px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="EXPENSE">Despesa</SelectItem>
                            <SelectItem value="INCOME">Receita</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={handleAdd} size="icon"><Plus className="h-4 w-4" /></Button>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {filtered.map(cat => (
                        <div key={cat.id} className="group flex items-center justify-between p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: cat.color }} />
                                <span className="text-sm font-medium">{cat.name}</span>
                                <Badge variant="secondary" className="text-[10px] h-5">{cat.type === 'INCOME' ? 'Receita' : 'Despesa'}</Badge>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                {!cat.isDefault && (
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteCategory(cat.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export function RulesSettings() {
    const { categorizationRules, addRule, deleteRule, toggleRule } = useAppStore(state => ({
        ...state,
        toggleRule: (id: string) => state.updateRule(id, { active: !state.categorizationRules.find(r => r.id === id)?.active })
    }));

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Regras de Categorização</CardTitle>
                    <CardDescription>Automatize a classificação de lançamentos.</CardDescription>
                </div>
                <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Nova Regra</Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {categorizationRules.map(rule => (
                        <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg bg-card text-card-foreground shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="bg-muted p-2 rounded text-muted-foreground">
                                    <RefreshCw className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{rule.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Se {rule.condition} "{rule.value}" → Categoria ID {rule.categoryId}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch checked={rule.active} onCheckedChange={() => toggleRule(rule.id)} />
                                <Button variant="ghost" size="icon" onClick={() => deleteRule(rule.id)}>
                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export function IntegrationsSettings() {
    const { integrations, updateIntegration } = useAppStore();

    const getIcon = (provider: Integration['provider']) => {
        switch (provider) {
            case 'GOOGLE_CALENDAR': return <Smartphone className="h-5 w-5" />;
            case 'GOOGLE_DRIVE': return <Cloud className="h-5 w-5" />;
            case 'WHATSAPP': return <Smartphone className="h-5 w-5" />;
            case 'EMAIL': return <Mail className="h-5 w-5" />;
            case 'STRIPE': return <CreditCard className="h-5 w-5" />;
            default: return <Cloud className="h-5 w-5" />;
        }
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {integrations.map(integ => (
                <Card key={integ.id} className={cn("border-l-4", integ.status === 'CONNECTED' ? "border-l-emerald-500" : "border-l-muted")}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-full text-primary">
                                {getIcon(integ.provider)}
                            </div>
                            <CardTitle className="text-base">{integ.name}</CardTitle>
                        </div>
                        <Badge variant={integ.status === 'CONNECTED' ? 'default' : 'outline'}>
                            {integ.status === 'CONNECTED' ? 'Conectado' : 'Desconectado'}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground mb-4">
                            {integ.status === 'CONNECTED'
                                ? `Sincronizado em ${integ.lastSync ? new Date(integ.lastSync).toLocaleDateString() : 'N/A'}`
                                : 'Conecte para habilitar recursos automáticos.'}
                        </p>
                        <div className="flex gap-2">
                            {integ.status === 'DISCONNECTED' ? (
                                <Button
                                    size="sm"
                                    className="w-full"
                                    onClick={() => {
                                        toast.promise(
                                            new Promise(r => setTimeout(r, 1000)),
                                            { loading: 'Conectando...', success: 'Conectado com sucesso!', error: 'Erro' }
                                        );
                                        updateIntegration(integ.id, { status: 'CONNECTED', lastSync: new Date().toISOString() });
                                    }}
                                >
                                    Conectar
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => updateIntegration(integ.id, { status: 'DISCONNECTED' })}
                                >
                                    Desconectar
                                </Button>
                            )}
                            <Button variant="ghost" size="icon"><Settings className="h-4 w-4" /></Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export function StudioSettings() {
    const { settings, updateSettings } = useAppStore();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Padrões do Estúdio</CardTitle>
                <CardDescription>Defina métricas base para sua operação PJ.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <div className="flex justify-between mb-2">
                        <Label>Valor Hora Padrão</Label>
                        <span className="text-sm font-bold text-primary">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(settings.studio.defaultHourlyRate / 100)}
                        </span>
                    </div>
                    <Slider
                        defaultValue={[settings.studio.defaultHourlyRate / 100]}
                        max={500}
                        step={10}
                        onValueChange={(vals) => updateSettings(s => ({ studio: { ...s.studio, defaultHourlyRate: vals[0] * 100 } }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Usado para estimativas de orçamento rápidas.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Risco de Prazo (Dias)</Label>
                        <Input
                            type="number"
                            value={settings.studio.riskThresholdDays}
                            onChange={(e) => updateSettings(s => ({ studio: { ...s.studio, riskThresholdDays: parseInt(e.target.value) } }))}
                        />
                        <p className="text-[10px] text-muted-foreground">Projetos com entrega em X dias entram em risco.</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Risco de Inatividade (Dias)</Label>
                        <Input
                            type="number"
                            value={settings.studio.inactiveRiskDays}
                            onChange={(e) => updateSettings(s => ({ studio: { ...s.studio, inactiveRiskDays: parseInt(e.target.value) } }))}
                        />
                        <p className="text-[10px] text-muted-foreground">Alertar se projeto parado por X dias.</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function AlertsSettings() {
    const { settings, updateSettings } = useAppStore();
    return (
        <Card>
            <CardHeader>
                <CardTitle>Alertas e Notificações</CardTitle>
                <CardDescription>Defina o que merece sua atenção.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <h3 className="text-sm font-medium">Canais de Envio</h3>
                    <div className="flex items-center justify-between">
                        <Label>Notificações no App</Label>
                        <Switch checked={settings.notifications.channels.app} onCheckedChange={v => updateSettings(s => ({ notifications: { ...s.notifications, channels: { ...s.notifications.channels, app: v } } }))} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>WhatsApp</Label>
                            <p className="text-[10px] text-muted-foreground">Requer integração ativa.</p>
                        </div>
                        <Switch checked={settings.notifications.channels.whatsapp} disabled={true} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function ImportSettings() {
    const { settings, updateSettings } = useAppStore();
    return (
        <Card>
            <CardHeader>
                <CardTitle>Importação e Conciliação</CardTitle>
                <CardDescription>Ajuste a inteligência da importação bancária.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="flex justify-between">
                        <Label>Tolerância de Datas (Dias)</Label>
                        <span className="font-mono text-sm">{settings.import.dateTolerance} dias</span>
                    </div>
                    <Slider
                        min={0} max={10} step={1}
                        value={[settings.import.dateTolerance]}
                        onValueChange={([v]) => updateSettings(s => ({ import: { ...s.import, dateTolerance: v } }))}
                    />
                    <p className="text-xs text-muted-foreground">Considerar transações com até {settings.import.dateTolerance} dias de diferença para conciliação automática.</p>
                </div>

                <div className="flex items-center justify-between">
                    <Label>Categorizar Automaticamente</Label>
                    <Switch checked={settings.import.autoCategorize} onCheckedChange={v => updateSettings(s => ({ import: { ...s.import, autoCategorize: v } }))} />
                </div>
            </CardContent>
        </Card>
    );
}

export function ExportSettings() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Exportação e Backup</CardTitle>
                <CardDescription>Seus dados são seus. Baixe quando quiser.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => toast.success("Exportando CSV...")}>
                        <FileText className="h-6 w-6" />
                        <span>Exportar CSV (Geral)</span>
                    </Button>
                    <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => toast.success("Gerando PDF...")}>
                        <FileText className="h-6 w-6" />
                        <span>Relatório PJ (PDF)</span>
                    </Button>
                </div>
                <div className="pt-4 border-t">
                    <Button className="w-full" onClick={() => toast.success("Backup completo gerado!")}>
                        <ArrowDownCircle className="mr-2 h-4 w-4" /> Baixar Backup Completo (.json)
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export function SecuritySettings() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Segurança</CardTitle>
                    <CardDescription>Proteja sua conta e sessões.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-full text-primary"><Lock className="h-4 w-4" /></div>
                            <div>
                                <p className="text-sm font-medium">Senha</p>
                                <p className="text-xs text-muted-foreground">Última alteração há 3 meses</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm">Aleterar</Button>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-full text-primary"><Shield className="h-4 w-4" /></div>
                            <div>
                                <p className="text-sm font-medium">Autenticação em 2 Etapas</p>
                                <p className="text-xs text-muted-foreground">Recomendado</p>
                            </div>
                        </div>
                        <Switch />
                    </div>

                    <div className="pt-4">
                        <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10">
                            <LogOut className="mr-2 h-4 w-4" /> Sair de todas as sessões
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <DangerousZoneSettings />
        </div>
    );
}
