"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Download, PieChart, FileText } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ReportsView } from "@/components/pj/reports-view";

export default function RelatoriosPage() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">Relatórios</h1>
                    <p className="text-muted-foreground text-sm flex items-center gap-1">
                        <PieChart className="h-3 w-3" /> Performance financeira e operacional PJ.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-[220px] justify-start text-left font-normal bg-card shadow-sm", !selectedDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, "MMMM yyyy", { locale: ptBR }) : <span>Selecione o período</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(d) => d && setSelectedDate(d)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <Button variant="outline" size="icon" className="shadow-sm" title="Exportar PDF">
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="monthly" className="space-y-6">
                <TabsList className="bg-muted/50 p-1 border">
                    <TabsTrigger value="monthly" className="gap-2">
                        <CalendarIcon className="h-4 w-4" /> Mensal
                    </TabsTrigger>
                    <TabsTrigger value="annual" className="gap-2">
                        <FileText className="h-4 w-4" /> Anual
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="monthly">
                    <ReportsView period="MONTHLY" date={selectedDate} />
                </TabsContent>

                <TabsContent value="annual">
                    <ReportsView period="ANNUAL" date={selectedDate} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
