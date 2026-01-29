"use client";

import { useAppStore } from "@/store/use-store";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Building2, Infinity } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function GlobalModeSwitcher() {
    const { mode, setMode } = useAppStore();

    return (
        <div className="px-3 py-2">
            <TooltipProvider delayDuration={300}>
                <Tabs value={mode} onValueChange={(v: any) => setMode(v)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-sidebar-accent/50 p-1 h-10 border border-sidebar-border">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <TabsTrigger value="PF" className="text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-primary/30 border border-transparent transition-all">
                                    <User className="h-3.5 w-3.5 mr-1.5" /> PF
                                </TabsTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">Pessoa Física</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <TabsTrigger value="PJ" className="text-xs data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-500 data-[state=active]:border-blue-500/30 border border-transparent transition-all">
                                    <Building2 className="h-3.5 w-3.5 mr-1.5" /> PJ
                                </TabsTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">Pessoa Jurídica</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <TabsTrigger value="CONSOLIDATED" className="text-xs data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-500 data-[state=active]:border-purple-500/30 border border-transparent transition-all">
                                    <Infinity className="h-3.5 w-3.5 mr-1.5" /> 360°
                                </TabsTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">Visão Consolidada</TooltipContent>
                        </Tooltip>
                    </TabsList>
                </Tabs>
            </TooltipProvider>

            <div className="text-[10px] text-center mt-1 text-muted-foreground uppercase tracking-widest font-medium opacity-60">
                {mode === 'PF' ? 'Finanças Pessoais' : mode === 'PJ' ? 'Finanças Emp.' : 'Visão Global'}
            </div>
        </div>
    );
}
