"use client";

import { useState } from "react";
import {
    Settings,
    Layout,
    Palette,
    Tags,
    Workflow,
    Bell,
    ArrowLeftRight,
    Briefcase,
    Download,
    ShieldCheck,
    Database,
    Landmark,
    Menu,
    ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    PreferencesSettings,
    ModesSettings,
    CategoriesSettings,
    RulesSettings,
    AlertsSettings,
    ImportSettings,
    StudioSettings,
    IntegrationsSettings,
    ExportSettings,
    SecuritySettings
} from "@/components/settings/settings-views";

type SectionId = 'prefs' | 'modes' | 'cats' | 'rules' | 'alerts' | 'import' | 'studio' | 'integrations' | 'export' | 'security';

interface SettingsSection {
    id: SectionId;
    label: string;
    icon: any;
    component: React.ComponentType;
}

const SECTIONS: { group: string; items: SettingsSection[] }[] = [
    {
        group: "Geral",
        items: [
            { id: 'prefs', label: 'Preferências', icon: Settings, component: PreferencesSettings },
            { id: 'modes', label: 'Modos de Uso', icon: Layout, component: ModesSettings },
            { id: 'security', label: 'Segurança', icon: ShieldCheck, component: SecuritySettings },
        ]
    },
    {
        group: "Financeiro",
        items: [
            { id: 'cats', label: 'Categorias', icon: Tags, component: CategoriesSettings },
            { id: 'rules', label: 'Regras Automáticas', icon: Workflow, component: RulesSettings },
            { id: 'alerts', label: 'Alertas', icon: Bell, component: AlertsSettings },
            { id: 'import', label: 'Importação', icon: ArrowLeftRight, component: ImportSettings },
        ]
    },
    {
        group: "Estúdio",
        items: [
            { id: 'studio', label: 'Padrões PJ', icon: Briefcase, component: StudioSettings },
        ]
    },
    {
        group: "Conectividade",
        items: [
            { id: 'integrations', label: 'Integrações', icon: Database, component: IntegrationsSettings },
            { id: 'export', label: 'Exportar & Backup', icon: Download, component: ExportSettings },
        ]
    }
];

export default function SettingsPage() {
    const [activeSection, setActiveSection] = useState<SectionId>('prefs');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(true); // Start open on mobile? actually, start on list.

    // On desktop, we always show nav. On mobile, we toggle.
    // We can use a simple check: if on mobile, clicking a nav item hides nav and shows content.
    // Back button on content shows nav again.

    const ActiveComponent = SECTIONS.flatMap(g => g.items).find(i => i.id === activeSection)?.component || PreferencesSettings;
    const activeLabel = SECTIONS.flatMap(g => g.items).find(i => i.id === activeSection)?.label;

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] md:flex-row bg-background">
            {/* Sidebar Navigation */}
            <aside
                className={cn(
                    "w-full md:w-64 border-r bg-muted/20 flex-col overflow-y-auto hidden md:flex",
                    // Mobile visibility logic handled differently usually, but let's try CSS-only toggle or state
                )}
            >
                <div className="p-6 pb-2">
                    <h2 className="text-lg font-bold tracking-tight">Configurações</h2>
                    <p className="text-sm text-muted-foreground">Gerencie sua conta e padrões.</p>
                </div>
                <nav className="flex-1 px-4 space-y-6 py-4">
                    {SECTIONS.map(group => (
                        <div key={group.group}>
                            <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                                {group.group}
                            </h3>
                            <div className="space-y-1">
                                {group.items.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveSection(item.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors text-left",
                                            activeSection === item.id
                                                ? "bg-primary/10 text-primary hover:bg-primary/15"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        <item.icon className="h-4 w-4 shrink-0" />
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>
            </aside>

            {/* Mobile Navigation (Visible only on mobile when "menu" is notionally open, or always for this specific layout strategy?) 
               Let's do:
               Mobile: Shows List. When item clicked -> Full screen overlay of content.
            */}
            <div className={cn("md:hidden flex flex-col h-full", activeSection && !mobileMenuOpen ? "hidden" : "flex")}>
                <div className="p-4 border-b">
                    <h2 className="text-lg font-bold">Configurações</h2>
                </div>
                <div className="overflow-y-auto p-4 space-y-6">
                    {SECTIONS.map(group => (
                        <div key={group.group}>
                            <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                                {group.group}
                            </h3>
                            <div className="space-y-1">
                                {group.items.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => { setActiveSection(item.id); setMobileMenuOpen(false); }}
                                        className={cn(
                                            "w-full flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium border bg-card mb-2 shadow-sm active:scale-95 transition-all text-left"
                                        )}
                                    >
                                        <div className="p-2 bg-primary/10 rounded-full text-primary">
                                            <item.icon className="h-4 w-4" />
                                        </div>
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <main className={cn(
                "flex-1 overflow-y-auto p-4 md:p-8 bg-background h-full",
                // Mobile: hidden if menu is open
                mobileMenuOpen ? "hidden md:block" : "block"
            )}>
                {/* Mobile Header with Back Button */}
                <div className="md:hidden flex items-center gap-2 mb-6 pb-4 border-b">
                    <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <span className="font-bold">{activeLabel}</span>
                </div>

                {/* Desktop Breadcrumb / Header */}
                <div className="hidden md:block mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">{activeLabel}</h1>
                    <p className="text-muted-foreground">
                        Configurações {'>'} {SECTIONS.find(g => g.items.some(i => i.id === activeSection))?.group} {'>'} {activeLabel}
                    </p>
                </div>

                <div className="max-w-4xl mx-auto md:mx-0 anim-in fade-in slide-in-from-bottom-4 duration-500">
                    <ActiveComponent />
                </div>
            </main>
        </div>
    );
}
