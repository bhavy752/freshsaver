import { Package, ScanLine, ChefHat, ShoppingCart } from 'lucide-react';

export type DashboardTab = 'inventory' | 'scan' | 'recipes' | 'grocery';

interface BottomNavProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

const TABS: { key: DashboardTab; label: string; emoji: string; icon: typeof Package }[] = [
  { key: 'inventory', label: 'Inventory', emoji: '📦', icon: Package },
  { key: 'scan', label: 'Scan', emoji: '📷', icon: ScanLine },
  { key: 'recipes', label: 'Recipes', emoji: '👨‍🍳', icon: ChefHat },
  { key: 'grocery', label: 'Grocery', emoji: '🛒', icon: ShoppingCart },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-emerald-100 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-18px_rgba(16,185,129,0.6)]">
      <div className="flex items-center justify-around max-w-md mx-auto px-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center gap-0.5 py-2 px-3 rounded-2xl transition-all duration-200 active:scale-90 ${
                isActive
                  ? 'text-emerald-700 bg-emerald-50 -translate-y-0.5'
                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/50'
              }`}
            >
              <span className={`text-base leading-none transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                {tab.emoji}
              </span>
              <Icon
                className="w-4.5 h-4.5"
                strokeWidth={isActive ? 2.5 : 2}
                fill={isActive ? 'currentColor' : 'none'}
                fillOpacity={isActive ? 0.12 : 0}
              />
              <span className="text-[10px] font-bold">{tab.label}</span>
              {isActive && (
                <span className="absolute -bottom-0.5 w-6 h-1 rounded-full bg-gradient-to-r from-emerald-400 to-amber-400" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
