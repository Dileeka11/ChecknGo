import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import CameraCapture from '@/components/checkout/CameraCapture';
import WeightScaleCamera from '@/components/checkout/WeightScaleCamera';
import ResultsPanel from '@/components/checkout/ResultsPanel';
import TransactionList from '@/components/checkout/TransactionList';
import InvoicePrint from '@/components/checkout/InvoicePrint';
import QuickAddCustomerDialog from '@/components/checkout/QuickAddCustomerDialog';
import { FruitItem, CameraStatus, StockAvailability } from '@/types';
import { FRUIT_EMOJIS } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/currency';
import { predictFruit, searchStockByName, createInvoice, InvoiceResponse } from '@/lib/api';

// Extended FruitItem with stock info (weight-based)
interface CheckoutItem extends FruitItem {
  itemId: string;
  itemCode: string;
  stockInfo?: StockAvailability;
}

interface SelectedCustomer {
  _id: string;
  name: string;
  email: string;
}

const CheckoutPage = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<CameraStatus>('ready');
  const [currentItem, setCurrentItem] = useState<CheckoutItem | null>(null);
  const [currentWeight, setCurrentWeight] = useState<number>(0);
  const [stockInfo, setStockInfo] = useState<StockAvailability | null>(null);
  const [transactionItems, setTransactionItems] = useState<CheckoutItem[]>([]);
  const [lastInvoice, setLastInvoice] = useState<InvoiceResponse['data'] | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<SelectedCustomer | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handleCapture = useCallback(async (imageData: string) => {
    setStatus('processing');
    setStockInfo(null);
    
    const CONFIDENCE_THRESHOLD = 50;
    
    try {
      // Call AI model to identify fruit/vegetable
      const response = await predictFruit(imageData);
      
      if (!response.success || !response.prediction) {
        throw new Error(response.error || 'Prediction failed');
      }
      
      const { fruit, confidence } = response.prediction;
      
      if (confidence < CONFIDENCE_THRESHOLD) {
        setStatus('error');
        toast.warning(
          `Low confidence (${confidence.toFixed(1)}%). Please use a clear image.`,
          { duration: 5000 }
        );
        return;
      }
      
      // Check stock availability
      const stockResponse = await searchStockByName(fruit);
      
      if (!stockResponse.success) {
        setStatus('error');
        toast.error('Failed to check stock availability');
        return;
      }
      
      if (!stockResponse.inStock || !stockResponse.data) {
        setStatus('error');
        toast.error(`${fruit} is not available in stock`);
        return;
      }
      
      const stock = stockResponse.data;
      setStockInfo(stock);
      
      const newItem: CheckoutItem = {
        id: `item-${Date.now()}`,
        itemId: stock.itemId,
        itemCode: stock.itemCode,
        name: fruit,
        confidence,
        weight: 0,
        unitPrice: stock.fifoPrice, // Price per kg from FIFO
        totalPrice: 0,
        timestamp: new Date(),
        imageUrl: imageData,
        stockInfo: stock,
      };
      
      setCurrentItem(newItem);
      setCurrentWeight(0);
      setStatus('identified');
      toast.success(`${FRUIT_EMOJIS[fruit] || '🍎'} ${fruit} identified! Available: ${stock.availableWeight.toFixed(2)} kg`);
    } catch (error) {
      setStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Failed to identify';
      toast.error(`Failed to identify: ${errorMessage}`);
    }
  }, []);

  const handleWeightChange = useCallback((weight: number) => {
    setCurrentWeight(weight);
    if (currentItem) {
      const totalPrice = Math.round(weight * currentItem.unitPrice * 100) / 100;
      setCurrentItem({
        ...currentItem,
        weight,
        totalPrice,
      });
    }
  }, [currentItem]);

  const handleWeightDetected = useCallback((weight: number) => {
    setCurrentWeight(weight);
    if (currentItem) {
      const totalPrice = Math.round(weight * currentItem.unitPrice * 100) / 100;
      setCurrentItem({
        ...currentItem,
        weight,
        totalPrice,
      });
    }
  }, [currentItem]);

  const handleAddToBill = useCallback(() => {
    if (currentItem && currentWeight > 0) {
      // Check if weight exceeds available stock
      if (stockInfo && currentWeight > stockInfo.availableWeight) {
        toast.error(`Only ${stockInfo.availableWeight.toFixed(2)} kg available in stock`);
        return;
      }
      
      const finalItem: CheckoutItem = {
        ...currentItem,
        weight: currentWeight,
        totalPrice: Math.round(currentWeight * currentItem.unitPrice * 100) / 100,
      };
      setTransactionItems(prev => [...prev, finalItem]);
      toast.success('Item added to bill!');
      setCurrentItem(null);
      setCurrentWeight(0);
      setStockInfo(null);
      setStatus('ready');
    } else if (currentWeight <= 0) {
      toast.error('Please enter weight before adding to bill');
    }
  }, [currentItem, currentWeight, stockInfo]);

  const handleClear = useCallback(() => {
    setCurrentItem(null);
    setCurrentWeight(0);
    setStockInfo(null);
    setStatus('ready');
  }, []);

  const handleManualEntry = useCallback(() => {
    toast.info('Manual entry feature coming soon!');
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    setTransactionItems(prev => prev.filter(item => item.id !== id));
    toast.success('Item removed');
  }, []);

  const handleFinalizeBill = useCallback(async () => {
    if (transactionItems.length === 0) return;
    
    try {
      // Prepare invoice data (weight-based, no quantity)
      const invoiceData = {
        customerId: selectedCustomer?._id,
        customerName: selectedCustomer?.name || 'Walk-in Customer',
        customerEmail: selectedCustomer?.email,
        items: transactionItems.map(item => ({
          itemId: item.itemId,
          itemCode: item.itemCode,
          itemName: item.name,
          weight: item.weight,
        })),
        paymentMethod: 'cash' as const,
        createdBy: user?.name || 'Staff',
      };
      
      const response = await createInvoice(invoiceData);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create invoice');
      }
      
      setLastInvoice(response.data);
      setShowPrintDialog(true);
      
      const total = response.data.totalAmount;
      let successMsg = `Invoice ${response.data.invoiceNumber} created! Total: ${formatCurrency(total)}`;
      if (selectedCustomer?.email) {
        successMsg += ` | Receipt emailed to ${selectedCustomer.email}`;
      }
      toast.success(successMsg);
      
      setTransactionItems([]);
      setCurrentItem(null);
      setStockInfo(null);
      setSelectedCustomer(null);
      setStatus('ready');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create invoice';
      toast.error(errorMessage);
    }
  }, [transactionItems, user, selectedCustomer]);

  const handleNewTransaction = useCallback(() => {
    setTransactionItems([]);
    setCurrentItem(null);
    setCurrentWeight(0);
    setStockInfo(null);
    setLastInvoice(null);
    setShowPrintDialog(false);
    setSelectedCustomer(null);
    setStatus('ready');
    toast.info('New transaction started');
  }, []);

  const handlePrintInvoice = useCallback(() => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open('', '', 'width=400,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Invoice</title>
            <style>
              body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; }
              .invoice-header { text-align: center; margin-bottom: 20px; }
              .invoice-title { font-size: 24px; font-weight: bold; }
              .invoice-info { margin: 10px 0; }
              .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .items-table th, .items-table td { padding: 8px; text-align: left; border-bottom: 1px dashed #ccc; }
              .items-table th { font-weight: bold; }
              .total-row { font-weight: bold; font-size: 18px; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>${printContent}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
    setShowPrintDialog(false);
  }, []);

  const handleClosePrintDialog = useCallback(() => {
    setShowPrintDialog(false);
  }, []);

  const handleCustomerAdded = useCallback((customer: { _id: string; name: string; email: string }) => {
    setSelectedCustomer(customer);
  }, []);

  const handleClearCustomer = useCallback(() => {
    setSelectedCustomer(null);
  }, []);

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <Header />
      <main className="container px-4 py-6 md:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Camera Section */}
          <div className="space-y-6">
            <CameraCapture onCapture={handleCapture} status={status} />
            <WeightScaleCamera
              onWeightDetected={handleWeightDetected}
              disabled={!currentItem}
            />
          </div>

          {/* Right: Results & Transaction */}
          <div className="space-y-6">
            <ResultsPanel
              currentItem={currentItem}
              weight={currentWeight}
              stockInfo={stockInfo}
              onWeightChange={handleWeightChange}
              onPrintBill={handleAddToBill}
              onClear={handleClear}
              onManualEntry={handleManualEntry}
              isProcessing={status === 'processing'}
            />
            <TransactionList
              items={transactionItems}
              onRemoveItem={handleRemoveItem}
              onFinalizeBill={handleFinalizeBill}
              onNewTransaction={handleNewTransaction}
              onQuickAddCustomer={() => setShowQuickAddCustomer(true)}
              selectedCustomer={selectedCustomer}
              onClearCustomer={handleClearCustomer}
            />
          </div>
        </div>
      </main>
      
      {/* Quick Add Customer Dialog */}
      <QuickAddCustomerDialog
        open={showQuickAddCustomer}
        onOpenChange={setShowQuickAddCustomer}
        onCustomerAdded={handleCustomerAdded}
      />

      {/* Print Dialog */}
      {showPrintDialog && lastInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-auto">
            <div ref={printRef}>
              <InvoicePrint invoice={lastInvoice} />
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handlePrintInvoice}
                className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 font-medium"
              >
                Print Invoice
              </button>
              <button
                onClick={handleClosePrintDialog}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;