import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import CameraCapture from '@/components/checkout/CameraCapture';
import ResultsPanel from '@/components/checkout/ResultsPanel';
import TransactionList from '@/components/checkout/TransactionList';
import { FruitItem, CameraStatus } from '@/types';
import { FRUIT_PRICES, FRUIT_EMOJIS } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/currency';
import { predictFruit } from '@/lib/api';

const CheckoutPage = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<CameraStatus>('ready');
  const [currentItem, setCurrentItem] = useState<FruitItem | null>(null);
  const [currentWeight, setCurrentWeight] = useState<number>(0);
  const [transactionItems, setTransactionItems] = useState<FruitItem[]>([]);

  const handleCapture = useCallback(async (imageData: string) => {
    setStatus('processing');
    
    // Minimum confidence threshold (50% for testing - can increase later)
    const CONFIDENCE_THRESHOLD = 50;
    
    try {
      // Call real AI model API
      const response = await predictFruit(imageData);
      
      if (!response.success || !response.prediction) {
        throw new Error(response.error || 'Prediction failed');
      }
      
      const { fruit, confidence } = response.prediction;
      
      // Check if confidence is too low
      if (confidence < CONFIDENCE_THRESHOLD) {
        setStatus('error');
        toast.warning(
          `Low confidence (${confidence.toFixed(1)}%). Please use a clear image of a fruit or vegetable.`,
          { duration: 5000 }
        );
        return;
      }
      
      const unitPrice = FRUIT_PRICES[fruit] || 100;
      
      const newItem: FruitItem = {
        id: `item-${Date.now()}`,
        name: fruit,
        confidence,
        weight: 0, // Manual weight entry - user will set this
        unitPrice,
        totalPrice: 0, // Will be calculated when weight is entered
        timestamp: new Date(),
        imageUrl: imageData,
      };
      
      setCurrentItem(newItem);
      setCurrentWeight(0); // Reset for manual entry
      setStatus('identified');
      toast.success(`${FRUIT_EMOJIS[fruit] || '🍎'} ${fruit} identified with ${confidence.toFixed(1)}% confidence!`);
    } catch (error) {
      setStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Failed to identify';
      toast.error(`Failed to identify: ${errorMessage}`);
    }
  }, []);

  const handleWeightChange = useCallback((weight: number) => {
    setCurrentWeight(weight);
    // Update current item with new weight and recalculated total
    if (currentItem) {
      setCurrentItem({
        ...currentItem,
        weight,
        totalPrice: Math.round(weight * currentItem.unitPrice * 100) / 100,
      });
    }
  }, [currentItem]);

  const handlePrintBill = useCallback(() => {
    if (currentItem && currentWeight > 0) {
      // Ensure item has final weight and price
      const finalItem = {
        ...currentItem,
        weight: currentWeight,
        totalPrice: Math.round(currentWeight * currentItem.unitPrice * 100) / 100,
      };
      setTransactionItems(prev => [...prev, finalItem]);
      toast.success('Item added to bill!');
      setCurrentItem(null);
      setCurrentWeight(0);
      setStatus('ready');
    } else if (currentWeight <= 0) {
      toast.error('Please enter weight before adding to bill');
    }
  }, [currentItem, currentWeight]);

  const handleClear = useCallback(() => {
    setCurrentItem(null);
    setCurrentWeight(0);
    setStatus('ready');
  }, []);

  const handleManualEntry = useCallback(() => {
    toast.info('Manual entry feature coming soon!');
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    setTransactionItems(prev => prev.filter(item => item.id !== id));
    toast.success('Item removed');
  }, []);

  const handleFinalizeBill = useCallback(() => {
    if (transactionItems.length > 0) {
      const total = transactionItems.reduce((sum, item) => sum + item.totalPrice, 0);
      toast.success(`Bill finalized by ${user?.name}! Total: ${formatCurrency(total)}`);
      // In a real app, this would save the transaction with staffId and staffName
      console.log('Transaction completed:', {
        items: transactionItems,
        total,
        staffId: user?.id,
        staffName: user?.name,
        timestamp: new Date(),
      });
      setTransactionItems([]);
      setCurrentItem(null);
      setStatus('ready');
    }
  }, [transactionItems, user]);

  const handleNewTransaction = useCallback(() => {
    setTransactionItems([]);
    setCurrentItem(null);
    setStatus('ready');
    toast.info('New transaction started');
  }, []);

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <Header />
      <main className="container px-4 py-6 md:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Camera Section */}
          <div className="space-y-6">
            <CameraCapture onCapture={handleCapture} status={status} />
          </div>

          {/* Right: Results & Transaction */}
          <div className="space-y-6">
            <ResultsPanel
              currentItem={currentItem}
              weight={currentWeight}
              onWeightChange={handleWeightChange}
              onPrintBill={handlePrintBill}
              onClear={handleClear}
              onManualEntry={handleManualEntry}
              isProcessing={status === 'processing'}
            />
            <TransactionList
              items={transactionItems}
              onRemoveItem={handleRemoveItem}
              onFinalizeBill={handleFinalizeBill}
              onNewTransaction={handleNewTransaction}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;