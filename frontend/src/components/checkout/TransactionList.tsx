import { Trash2, ShoppingBag, Receipt, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FruitItem } from '@/types';
import { FRUIT_EMOJIS } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';

interface TransactionListProps {
  items: FruitItem[];
  onRemoveItem: (id: string) => void;
  onFinalizeBill: () => void;
  onNewTransaction: () => void;
}

const TransactionList = ({
  items,
  onRemoveItem,
  onFinalizeBill,
  onNewTransaction,
}: TransactionListProps) => {
  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <Card className="border-0 shadow-elevated">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-success to-success/80 shadow-md">
              <ShoppingBag className="h-5 w-5 text-success-foreground" />
            </div>
            <div>
              <span className="text-lg font-semibold text-foreground">Current Transaction</span>
              <p className="text-sm font-normal text-muted-foreground">
                {items.length} item{items.length !== 1 ? 's' : ''} added
              </p>
            </div>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length > 0 ? (
          <>
            {/* Items List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/30 hover:bg-muted/60 transition-colors animate-slide-up",
                    `stagger-${Math.min(index + 1, 5)}`
                  )}
                  style={{ opacity: 0 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card border border-border/50 text-xl shadow-sm">
                      {FRUIT_EMOJIS[item.name] || '🍎'}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground font-mono-numbers">
                        {item.weight.toFixed(2)} kg × Rs. {item.unitPrice}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono-numbers text-foreground">
                      {formatCurrency(item.totalPrice)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveItem(item.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-secondary to-muted border border-primary/20">
              <span className="text-lg font-semibold text-foreground">Grand Total</span>
              <span className="text-2xl font-bold font-mono-numbers text-primary">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={onNewTransaction} variant="outline" className="flex-1">
                New Transaction
              </Button>
              <Button onClick={onFinalizeBill} className="flex-1 shadow-md">
                <Receipt className="h-5 w-5 mr-2" />
                Finalize Bill
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              No items in current transaction
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Scan items to add them here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionList;