import { ChefHat, BarChart3 } from 'lucide-react';
import type { PantryScoreResult } from '@/lib/pantryScore';

interface PantryHealthWidgetProps {
  pantryScore: PantryScoreResult | null;
  expiringCount: number;
}

export function PantryHealthWidget({ pantryScore }: PantryHealthWidgetProps) {
  const score = pantryScore?.score ?? 0;
  const breakdown = pantryScore?.breakdown;

  const scoreColor = score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';

  return (
    <div className="rounded-2xl bg-white border border-slateink-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <ChefHat className="w-4 h-4 text-sage-500" strokeWidth={2.5} />
            <h3 className="text-sm font-extrabold text-slateink-700">Pantry Health Score</h3>
          </div>

          {breakdown ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slateink-600 space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-slateink-400">Active Items (35%)</span>
                    <span className="font-bold text-slateink-800">{breakdown.activeUtilization}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slateink-400">Shelf-Life (30%)</span>
                    <span className="font-bold text-slateink-800">{breakdown.shelfLifeCompliance}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slateink-400">Fresh Items (25%)</span>
                    <span className="font-bold text-slateink-800">{breakdown.notNearExpiry}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slateink-400">Zero-Waste (10%)</span>
                    <span className="font-bold text-slateink-800">{breakdown.zeroWasteStreak}%</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sage-50 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" strokeWidth={2} style={{ color: scoreColor }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-3">
              <p className="text-xs text-slateink-400">No items in inventory yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}