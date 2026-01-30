import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { HelpCircle, RefreshCcw, Save } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface SimulatorSidebarProps {
    basePayment: number;
    setBasePayment: (v: number) => void;
    extraOneTime: number;
    setExtraOneTime: (v: number) => void;
    payMinimums: boolean;
    setPayMinimums: (v: boolean) => void;
    pauseRenegotiated: boolean;
    setPauseRenegotiated: (v: boolean) => void;
    strategy: 'AVALANCHE' | 'SNOWBALL';
    setStrategy: (v: 'AVALANCHE' | 'SNOWBALL') => void;
    scenario: 'CONSERVATIVE' | 'CURRENT' | 'AGGRESSIVE';
    setScenario: (v: 'CONSERVATIVE' | 'CURRENT' | 'AGGRESSIVE') => void;
    effectivePayment: number;
    onSaveScenario: () => void;
    onReset: () => void;
}

export function SimulatorSidebar({
    basePayment, setBasePayment,
    extraOneTime, setExtraOneTime,
    payMinimums, setPayMinimums,
    pauseRenegotiated, setPauseRenegotiated,
    strategy, setStrategy,
    scenario, setScenario,
    effectivePayment,
    onSaveScenario, onReset
}: SimulatorSidebarProps) {

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val / 100);

    return (
        <div className="flex flex-col h-full bg-card/50 border-r p-6 overflow-y-auto w-full md:w-[340px] gap-8">
            {/* BLOCO A - BASE DO PLANO */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Base do Plano</h3>
                </div>

                <div className="space-y-3">
                    <div className="space-y-1">
                        <Label className="text-xs">Aporte Mensal (Base)</Label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                value={basePayment / 100}
                                onChange={(e) => setBasePayment(Math.max(0, Number(e.target.value) * 100))}
                                className="h-9 font-mono"
                            />
                        </div>
                        <Slider
                            value={[basePayment]}
                            max={5000000} // 50k
                            step={100}
                            onValueChange={(v) => setBasePayment(v[0])}
                            className="py-2"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs">Extra no Mês 1</Label>
                        <Input
                            type="number"
                            value={extraOneTime / 100}
                            onChange={(e) => setExtraOneTime(Math.max(0, Number(e.target.value) * 100))}
                            placeholder="Ex: 13º Salário"
                            className="h-9 font-mono"
                        />
                    </div>

                    <Collapsible>
                        <CollapsibleTrigger className="flex items-center gap-2 text-xs py-2 text-muted-foreground hover:text-foreground w-full text-left group">
                            <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
                            Opções Avançadas
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-3 pt-1 pl-5">
                            <div className="flex items-center justify-between pointer-events-auto">
                                <Label className="text-xs cursor-pointer select-none" onClick={() => setPayMinimums(!payMinimums)}>Pagar Mínimos</Label>
                                <Switch checked={payMinimums} onCheckedChange={setPayMinimums} className="scale-75 origin-right" />
                            </div>
                            <div className="flex items-center justify-between pointer-events-auto">
                                <Label className="text-xs cursor-pointer select-none" onClick={() => setPauseRenegotiated(!pauseRenegotiated)}>Pausar Renegoc.</Label>
                                <Switch checked={pauseRenegotiated} onCheckedChange={setPauseRenegotiated} className="scale-75 origin-right" />
                            </div>
                        </CollapsibleContent>
                    </Collapsible>

                    <p className="text-[10px] text-muted-foreground bg-muted/30 p-2 rounded">
                        Define quanto do seu orçamento mensal será destinado exclusivamente para quitar dívidas.
                    </p>
                </div>
            </div>

            {/* BLOCO B - ESTRATÉGIA */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Estratégia</h3>
                </div>

                <div className="grid grid-cols-1 gap-2">
                    <div
                        onClick={() => setStrategy('AVALANCHE')}
                        className={`cursor-pointer border rounded-md p-3 transition-colors ${strategy === 'AVALANCHE' ? 'bg-primary/5 border-primary ring-1 ring-primary/20' : 'bg-background hover:bg-muted'}`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">Avalanche</span>
                            {strategy === 'AVALANCHE' && <div className="h-2 w-2 rounded-full bg-primary" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground">Foca nas dívidas com <strong>juros mais altos</strong>. Matematicamente mais barato.</p>
                    </div>

                    <div
                        onClick={() => setStrategy('SNOWBALL')}
                        className={`cursor-pointer border rounded-md p-3 transition-colors ${strategy === 'SNOWBALL' ? 'bg-cyan-500/5 border-cyan-500 ring-1 ring-cyan-500/20' : 'bg-background hover:bg-muted'}`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">Bola de Neve</span>
                            {strategy === 'SNOWBALL' && <div className="h-2 w-2 rounded-full bg-cyan-500" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground">Foca nas dívidas <strong>menores</strong>. Psicologicamente mais motivador.</p>
                    </div>
                </div>
            </div>

            {/* BLOCO C - CENÁRIO */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Cenário</h3>
                </div>

                <Tabs value={scenario} onValueChange={(v) => setScenario(v as any)} className="w-full">
                    <TabsList className="w-full grid grid-cols-3">
                        <TabsTrigger value="CONSERVATIVE" className="text-[10px]">Conserv.</TabsTrigger>
                        <TabsTrigger value="CURRENT" className="text-[10px]">Atual</TabsTrigger>
                        <TabsTrigger value="AGGRESSIVE" className="text-[10px]">Agressivo</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="bg-muted/50 rounded-md p-3 text-center border border-dashed">
                    <span className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Aporte Efetivo</span>
                    <span className="text-xl font-bold text-foreground block">{formatCurrency(effectivePayment)}</span>
                    <span className="text-[10px] text-muted-foreground mt-1 block">
                        {scenario === 'CONSERVATIVE' && "(-20% do aporte base)"}
                        {scenario === 'CURRENT' && "(Igual ao aporte base)"}
                        {scenario === 'AGGRESSIVE' && "(+20% do aporte base)"}
                    </span>
                </div>
            </div>

            <div className="mt-auto space-y-2 pt-6">
                <Button className="w-full" onClick={onSaveScenario}>
                    <Save className="mr-2 h-4 w-4" /> Salvar Cenário
                </Button>
                <Button variant="outline" className="w-full" onClick={onReset}>
                    <RefreshCcw className="mr-2 h-4 w-4" /> Resetar
                </Button>
            </div>
        </div>
    );
}
