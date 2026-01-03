import { Scale, Tag, DollarSign, Printer, RotateCcw, Edit3, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FruitItem } from '@/types';
import { FRUIT_EMOJIS } from '@/data/mockData';
import { formatCurrency } from '@/lib/currency';

interface ResultsPanelProps {
  currentItem: FruitItem | null;
  weight: number;
  onWeightChange: (weight: number) => void;
  onPrintBill: () => void;
  onClear: () => void;
  onManualEntry: () => void;
  isProcessing: boolean;
}

const ResultsPanel = ({
  currentItem,
  weight,
  onWeightChange,
  onPrintBill,
  onClear,
  onManualEntry,
  isProcessing,
}: ResultsPanelProps) => {
  return (
    <Card className="h-full border-0 shadow-elevated">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
            <Tag className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <span className="text-lg font-semibold text-foreground">Detection Result</span>
            <p className="text-sm font-normal text-muted-foreground">AI-powered recognition</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {currentItem ? (
          <>
            {/* Fruit Display */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-secondary/80 to-muted/50 border border-border/50">
              <div className="flex h-18 w-18 items-center justify-center rounded-2xl bg-card text-5xl shadow-soft border border-border/50">
                {FRUIT_EMOJIS[currentItem.name] || '🍎'}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-foreground tracking-tight">{currentItem.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Sparkles className="h-3.5 w-3.5 text-success" />
                  <p className="text-sm font-medium text-success">
                    {currentItem.confidence}% confident
                  </p>
                </div>
              </div>
            </div>

            {/* Weight & Price Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/30">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <Scale className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Weight (kg)</p>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={weight || ''}
                    onChange={(e) => onWeightChange(parseFloat(e.target.value) || 0)}
                    placeholder="Enter weight"
                    className="h-9 text-lg font-bold font-mono-numbers"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/30">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
                  <Tag className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Unit Price</p>
                  <p className="text-xl font-bold font-mono-numbers">Rs. {currentItem.unitPrice}/kg</p>
                </div>
              </div>
            </div>

            {/* Total Price */}
            <div className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground shadow-glow">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/20">
                  <DollarSign className="h-6 w-6" />
                </div>
                <span className="text-lg font-medium">Total Price</span>
              </div>
              <span className="text-3xl font-bold font-mono-numbers tracking-tight">
                {formatCurrency(currentItem.totalPrice)}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button onClick={onPrintBill} size="lg" className="w-full shadow-md">
                <Printer className="h-5 w-5 mr-2" />
                Add to Bill
              </Button>
              <div className="flex gap-3">
                <Button onClick={onClear} variant="secondary" className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                <Button onClick={onManualEntry} variant="outline" className="flex-1">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Manual Entry
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted mb-4">
              <Scale className={`h-10 w-10 text-muted-foreground ${isProcessing ? 'animate-pulse' : ''}`} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {isProcessing ? 'Identifying...' : 'No Item Detected'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {isProcessing
                ? 'AI is analyzing the captured image...'
                : 'Place fruit on the scale and capture an image to get started'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResultsPanel;