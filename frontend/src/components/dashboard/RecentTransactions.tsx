import { Clock, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Transaction } from '@/types';
import { FRUIT_EMOJIS } from '@/data/mockData';
import { formatCurrency } from '@/lib/currency';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const RecentTransactions = ({ transactions }: RecentTransactionsProps) => {
  return (
    <Card className="col-span-2 lg:col-span-3 border-0 shadow-elevated">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-primary shadow-glow-accent">
              <Clock className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <span className="text-lg font-semibold text-foreground">Recent Transactions</span>
              <p className="text-sm font-normal text-muted-foreground">Latest sales activity</p>
            </div>
          </CardTitle>
          <Link to="/history">
            <Button variant="ghost" size="sm" className="gap-1.5 text-primary hover:text-primary hover:bg-primary/10">
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Items</th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 8).map((txn, index) => (
                <tr 
                  key={txn.id} 
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors group"
                >
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
                      <span className="text-sm font-medium text-muted-foreground">
                        {txn.timestamp.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-1.5">
                      <div className="flex -space-x-1">
                        {txn.items.slice(0, 3).map((item, i) => (
                          <span 
                            key={i} 
                            className="text-lg bg-card border border-border rounded-full w-8 h-8 flex items-center justify-center shadow-sm" 
                            title={item.name}
                          >
                            {FRUIT_EMOJIS[item.name] || '🍎'}
                          </span>
                        ))}
                      </div>
                      {txn.items.length > 3 && (
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          +{txn.items.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-3 text-right">
                    <span className="font-semibold font-mono-numbers text-foreground group-hover:text-primary transition-colors">
                      {formatCurrency(txn.totalAmount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;