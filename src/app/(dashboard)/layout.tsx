"use client";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { useAppStore } from "@/store/use-store";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isSidebarOpen } = useAppStore();

    return (
        <div className="min-h-screen bg-background">
            <AppSidebar />
            <main
                className={cn(
                    "transition-all duration-300 min-h-screen pt-4 px-4 pb-8 md:pt-6 md:px-6", // Adjusted for 16px mobile / 24px desktop
                    isSidebarOpen ? "md:ml-64" : "md:ml-16"
                )}
            >
                <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {children}
                </div>
            </main>
        </div>
    );
}
