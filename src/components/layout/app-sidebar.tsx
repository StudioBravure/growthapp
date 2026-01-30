"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Wallet, Briefcase, Target, Settings, Menu, ChevronRight, Landmark, BarChart3, Zap, TrendingDown, PlusCircle, CalendarClock, Sun, Moon, Bell, Users, FileText, PieChart } from "lucide-react";
import { useAppStore } from "@/store/use-store";
import { GlobalModeSwitcher } from "./mode-switcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { UserNav } from "./user-nav";

const navItems = [
    { name: "Visão Geral", icon: LayoutDashboard, href: "/" },
    { name: "Financeiro", icon: Wallet, href: "/financeiro" },
    { name: "Projetos", icon: Briefcase, href: "/projetos" },
    { name: "Metas", icon: Target, href: "/metas" },
    { name: "Configurações", icon: Settings, href: "/config" },
];


export function AppSidebar() {
    const pathname = usePathname();
    const { isSidebarOpen, toggleSidebar, mode, alerts } = useAppStore();
    const { theme, setTheme } = useTheme();

    // Filter alerts relevant for the count badge
    const activeAlertsCount = alerts.filter(a => a.status === 'OPEN' && (mode === 'CONSOLIDATED' || a.ledgerType === mode)).length;

    const [mounted, setMounted] = useState(false);
    const [openGroups, setOpenGroups] = useState<string[]>(['financeiro', 'projetos', 'metas']);

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleGroup = (id: string) => {
        setOpenGroups(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
    };

    const isGroupActive = (hrefs: string[]) => hrefs.some(h => pathname === h || (h !== '/' && pathname.startsWith(h)));

    return (
        <aside className={cn(
            "fixed left-0 top-0 z-40 h-screen border-r border-border bg-sidebar transition-all duration-300 flex flex-col shadow-xl shadow-black/40",
            isSidebarOpen ? "w-64" : "w-16"
        )}>
            {/* Header */}
            <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border shrink-0 bg-surface-container-high/90 backdrop-blur-sm">
                {isSidebarOpen ? (
                    <div className="flex flex-col">
                        <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">Studio Bravure</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest -mt-1">Dashboard</span>
                    </div>
                ) : (
                    <span className="font-bold text-xl text-primary mx-auto">S</span>
                )}
                <Button variant="ghost" size="icon" onClick={toggleSidebar} className={cn("ml-auto hover:bg-muted text-muted-foreground h-6 w-6", !isSidebarOpen && "hidden")}>
                    <Menu className="h-4 w-4" />
                </Button>
                {!isSidebarOpen && (
                    <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mx-auto h-8 w-8 text-muted-foreground hover:text-primary">
                        <Menu className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 py-4 flex flex-col gap-2 overflow-y-auto overflow-x-hidden no-scrollbar">

                {/* 1. Mode Switcher (Always visible or adapted) */}
                {isSidebarOpen ? (
                    <GlobalModeSwitcher />
                ) : (
                    <div className="flex justify-center py-2 border-b border-sidebar-border/50 mb-2">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs ring-1 ring-primary/50">
                            360
                        </div>
                    </div>
                )}

                <nav className="space-y-1 px-2 mt-2">

                    {/* VISÃO GERAL (Single Item) */}
                    <Link
                        href="/"
                        className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all group relative overflow-hidden mb-4",
                            pathname === "/"
                                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                            !isSidebarOpen && "justify-center px-0 w-10 h-10 mx-auto"
                        )}
                    >
                        {pathname === "/" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />}
                        <LayoutDashboard className={cn("h-5 w-5 shrink-0 transition-colors", pathname === "/" ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
                        {isSidebarOpen && <span>Visão Geral</span>}
                    </Link>


                    {/* GROUPS */}

                    {/* --- PF SPECIFIC --- */}
                    {mode === 'PF' && (
                        <div className="space-y-4">
                            {/* Financeiro PF */}
                            <div className="space-y-0.5">
                                {isSidebarOpen && (
                                    <div
                                        onClick={() => toggleGroup('financeiro')}
                                        className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase cursor-pointer hover:text-foreground transition-colors mt-2"
                                    >
                                        <span>Financeiro PF</span>
                                        <div className="flex items-center gap-1">
                                            {activeAlertsCount > 0 && <Badge variant="destructive" className="h-4 px-1 text-[9px] animate-pulse">{activeAlertsCount}</Badge>}
                                            <ChevronRight className={cn("h-3 w-3 transition-transform", openGroups.includes('financeiro') && "rotate-90")} />
                                        </div>
                                    </div>
                                )}

                                {(isSidebarOpen ? openGroups.includes('financeiro') : true) && (
                                    <div className={cn("space-y-0.5", !isSidebarOpen && "flex flex-col gap-2 items-center border-t border-border/40 pt-2 mt-2")}>
                                        <NavItem
                                            href="/alerts"
                                            icon={Bell}
                                            label="Alertas PF"
                                            isSidebarOpen={isSidebarOpen}
                                            isActive={pathname === '/alerts'}
                                            alert={activeAlertsCount > 0 ? { count: activeAlertsCount, color: 'bg-destructive' } : undefined}
                                        />
                                        <NavItem href="/orcamentos" icon={PieChart} label="Orçamentos" isSidebarOpen={isSidebarOpen} isActive={pathname === '/orcamentos'} />
                                        <NavItem href="/financeiro" icon={Wallet} label="Transações" isSidebarOpen={isSidebarOpen} isActive={pathname === '/financeiro'} />
                                        <NavItem href="/financeiro/contas-fixas" icon={CalendarClock} label="Contas Fixas" isSidebarOpen={isSidebarOpen} isActive={pathname === '/financeiro/contas-fixas'} />
                                    </div>
                                )}
                            </div>

                            {/* Planejamento PF */}
                            <div className="space-y-0.5">
                                {isSidebarOpen && (
                                    <div
                                        onClick={() => toggleGroup('metas')}
                                        className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase cursor-pointer hover:text-foreground transition-colors mt-2"
                                    >
                                        <span>Planejamento PF</span>
                                        <ChevronRight className={cn("h-3 w-3 transition-transform", openGroups.includes('metas') && "rotate-90")} />
                                    </div>
                                )}

                                {(isSidebarOpen ? openGroups.includes('metas') : true) && (
                                    <div className={cn("space-y-0.5", !isSidebarOpen && "flex flex-col gap-2 items-center border-t border-border/40 pt-2 mt-2")}>
                                        <NavItem href="/metas" icon={Target} label="Dívidas" isSidebarOpen={isSidebarOpen} isActive={pathname === '/metas'} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- PJ SPECIFIC --- */}
                    {mode === 'PJ' && (
                        <div className="space-y-4">
                            <div className="space-y-0.5">
                                {isSidebarOpen && (
                                    <div
                                        className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase mt-2"
                                    >
                                        <span>Estúdio (PJ)</span>
                                    </div>
                                )}
                                <div className={cn("space-y-0.5", !isSidebarOpen && "flex flex-col gap-2 items-center border-t border-border/40 pt-2")}>
                                    <NavItem href="/pj/clientes" icon={Users} label="Clientes" isSidebarOpen={isSidebarOpen} isActive={pathname === '/pj/clientes'} />
                                    <NavItem href="/pj/projetos" icon={Briefcase} label="Projetos" isSidebarOpen={isSidebarOpen} isActive={pathname === '/pj/projetos'} />
                                    <NavItem href="/pj/relatorios" icon={PieChart} label="Relatórios" isSidebarOpen={isSidebarOpen} isActive={pathname === '/pj/relatorios'} />
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Settings Group */}
                    <div className="space-y-0.5 mt-8">
                        <NavItem href="/config" icon={Settings} label="Configurações" isSidebarOpen={isSidebarOpen} isActive={pathname === '/config'} />
                    </div>

                </nav>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-sidebar-border bg-sidebar/50 flex flex-col gap-3">
                {isSidebarOpen ? (
                    <>
                        <Button variant="default" className="w-full justify-start gap-2 shadow-sm font-semibold">
                            <PlusCircle className="h-4 w-4" /> Novo Lançamento
                        </Button>

                        {/* User Profile */}
                        <div className="flex items-center gap-2 px-2 py-2 border-t border-sidebar-border/30">
                            <UserNav />
                        </div>

                        {/* Theme Switcher */}
                        <div className="flex items-center justify-between px-2 pt-2 border-t border-sidebar-border/30">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                {theme === 'dark' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                                <span>{theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}</span>
                            </div>
                            {mounted && (
                                <Switch
                                    checked={theme === 'dark'}
                                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                                    className="scale-90 data-[state=checked]:bg-primary"
                                />
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col gap-4 items-center">
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-primary hover:bg-primary/10">
                            <PlusCircle className="h-5 w-5" />
                        </Button>
                        <UserNav />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-muted-foreground hover:text-primary transition-all"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        >
                            {mounted && (theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />)}
                        </Button>
                    </div>
                )}
            </div>
        </aside>
    );
}

// Subcomponent for cleaner rendering
function NavItem({ href, icon: Icon, label, isSidebarOpen, isActive, disabled, alert }: any) {
    if (disabled) return null; // Or render disabled state

    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all group relative overflow-hidden h-11", // h-11 = 44px
                isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                !isSidebarOpen && "justify-center px-0 w-11 h-11 mx-auto"
            )}
        >
            {isActive && <div className="absolute left-0 top-1 bottom-1 w-1 bg-primary rounded-r-full" />}
            <Icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-sidebar-accent-foreground" : "text-muted-foreground group-hover:text-primary")} />

            {isSidebarOpen && (
                <div className="flex-1 flex justify-between items-center overflow-hidden">
                    <span className="truncate leading-none">{label}</span>
                    {alert && (
                        <span className={cn("h-2 w-2 rounded-full", alert.color)} />
                    )}
                </div>
            )}

            {!isSidebarOpen && alert && (
                <span className={cn("absolute top-2 right-2 h-2 w-2 rounded-full ring-1 ring-background", alert.color)} />
            )}
        </Link>
    );
}
