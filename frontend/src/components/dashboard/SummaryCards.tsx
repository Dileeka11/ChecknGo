import { TrendingUp, ShoppingCart, DollarSign, Award, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';

interface SummaryCardsProps {
  totalSales: number;
  itemsSold: number;
  avgTransaction: number;
  topItem: string;
}

const SummaryCards = ({ totalSales, itemsSold, avgTransaction, topItem }: SummaryCardsProps) => {
  const cards = [
    {
      title: "Today's Sales",
      value: formatCurrency(totalSales, false),
      icon: DollarSign,
      gradient: 'from-primary via-primary to-accent',
      iconBg: 'bg-primary-foreground/20',
      textColor: 'text-primary-foreground',
      glow: true,
    },
    {
      title: 'Items Sold',
      value: itemsSold.toString(),
      icon: ShoppingCart,
      gradient: 'from-secondary to-muted',
      iconBg: 'bg-secondary-foreground/10',
      textColor: 'text-secondary-foreground',
      glow: false,
    },
    {
      title: 'Avg. Transaction',
      value: formatCurrency(avgTransaction, false),
      icon: TrendingUp,
      gradient: 'from-success/90 to-success',
      iconBg: 'bg-success-foreground/20',
      textColor: 'text-success-foreground',
      glow: false,
    },
    {
      title: 'Top Seller',
      value: topItem,
      icon: Award,
      gradient: 'from-warning via-warning to-warning/80',
      iconBg: 'bg-warning-foreground/15',
      textColor: 'text-warning-foreground',
      glow: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {cards.map((card, index) => (
        <Card
          key={card.title}
          className={cn(
            "overflow-hidden animate-scale-in border-0 shadow-elevated",
            `stagger-${index + 1}`,
            card.glow && "shadow-glow"
          )}
          style={{ opacity: 0 }}
        >
          <CardContent className={cn(
            "p-5 md:p-6 bg-gradient-to-br relative overflow-hidden",
            card.gradient
          )}>
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/10 to-transparent rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-black/5 to-transparent rounded-full translate-y-12 -translate-x-12" />
            
            <div className="flex items-start justify-between relative">
              <div className="space-y-1">
                <p className={cn("text-sm font-medium opacity-85", card.textColor)}>
                  {card.title}
                </p>
                <p className={cn(
                  "text-2xl lg:text-3xl font-bold tracking-tight font-mono-numbers",
                  card.textColor
                )}>
                  {card.value}
                </p>
              </div>
              <div className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl",
                card.iconBg
              )}>
                <card.icon className={cn("h-5 w-5", card.textColor)} />
              </div>
            </div>

            {index === 0 && (
              <div className="mt-3 flex items-center gap-1.5">
                <Sparkles className={cn("h-3.5 w-3.5 animate-pulse-soft", card.textColor, "opacity-80")} />
                <span className={cn("text-xs font-medium opacity-80", card.textColor)}>
                  Real-time tracking
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SummaryCards;