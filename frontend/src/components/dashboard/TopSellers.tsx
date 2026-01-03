import { Trophy, Crown, Medal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TopSeller } from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';

interface TopSellersProps {
  sellers: TopSeller[];
}

const TopSellers = ({ sellers }: TopSellersProps) => {
  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-4 w-4 text-warning" />;
    if (index === 1) return <Medal className="h-4 w-4 text-muted-foreground" />;
    if (index === 2) return <Medal className="h-4 w-4 text-warning/60" />;
    return null;
  };

  return (
    <Card className="border-0 shadow-elevated">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-warning to-warning/80 shadow-md">
            <Trophy className="h-5 w-5 text-warning-foreground" />
          </div>
          <div>
            <span className="text-lg font-semibold text-foreground">Top Sellers</span>
            <p className="text-sm font-normal text-muted-foreground">Best performing items</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-2">
          {sellers.slice(0, 5).map((seller, index) => (
            <div
              key={seller.name}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
                index === 0 
                  ? "bg-gradient-to-r from-warning/15 via-warning/10 to-transparent border border-warning/20" 
                  : "bg-muted/40 hover:bg-muted/70"
              )}
            >
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full font-bold text-sm transition-transform hover:scale-105",
                index === 0 ? "bg-gradient-to-br from-warning to-warning/80 text-warning-foreground shadow-md" : 
                index === 1 ? "bg-muted text-muted-foreground border border-border" :
                index === 2 ? "bg-warning/20 text-warning border border-warning/30" :
                "bg-muted text-muted-foreground"
              )}>
                {getRankIcon(index) || (index + 1)}
              </div>
              <span className="text-2xl">{seller.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{seller.name}</p>
                <p className="text-xs text-muted-foreground">
                  {seller.quantity} units sold
                </p>
              </div>
              <div className="text-right">
                <span className="font-bold font-mono-numbers text-primary">
                  {formatCurrency(seller.revenue, false)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopSellers;