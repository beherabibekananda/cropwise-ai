import { Search, Bell, Sparkles, Leaf } from "lucide-react";

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="flex items-center gap-3 mb-6 lg:mb-8">
      <div className="lg:hidden size-10 rounded-xl gradient-hero grid place-items-center shadow-glow">
        <Leaf className="size-5 text-primary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <h1 className="text-xl lg:text-2xl font-semibold tracking-tight truncate">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground truncate">{subtitle}</p>}
      </div>
      <div className="hidden md:flex items-center gap-2 glass rounded-full px-4 py-2 w-72">
        <Search className="size-4 text-muted-foreground" />
        <input
          placeholder="Search crops, diseases…"
          className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground"
        />
        <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">⌘K</kbd>
      </div>
      <button className="glass rounded-full size-10 grid place-items-center hover:scale-105 transition-transform">
        <Bell className="size-4" />
      </button>
      <button className="hidden sm:inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium gradient-hero text-primary-foreground shadow-glow hover:opacity-95 transition-opacity">
        <Sparkles className="size-4" />
        Upgrade
      </button>
    </header>
  );
}
