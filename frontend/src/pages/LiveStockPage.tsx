import { useState, useEffect, useCallback } from 'react';
import { Search, PackageSearch, AlertTriangle, TrendingUp, TrendingDown, ChevronDown, ChevronRight, RefreshCw, Layers } from 'lucide-react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface StockBatch {
  stockId: string;
  grnItemId: string;
  grnNumber: string;
  remainingQty: number;
  itemWeight: number;
  costPrice: number;
  sellingPrice: number;
  receivedDate: string;
}

interface GroupedStockItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  totalQty: number;
  totalWeight: number;
  totalCostValue: number;
  totalRetailValue: number;
  avgWeightPerUnit: number;
  batchCount: number;
  batches: StockBatch[];
}

interface StockSummary {
  totalItems: number;
  totalBatches: number;
  totalStockQty: number;
  totalStockWeight: number;
  totalCostValue: number;
  totalRetailValue: number;
}

const LiveStockPage = () => {
  const [loading, setLoading] = useState(true);
  const [stock, setStock] = useState<GroupedStockItem[]>([]);
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const fetchStock = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/stock/grouped`);
      const data = await response.json();
      
      if (data.success) {
        setStock(data.data || []);
        setSummary(data.summary || null);
      } else {
        toast.error(data.error || 'Failed to fetch stock');
      }
    } catch (error) {
      console.error('Error fetching stock:', error);
      toast.error('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const filteredStock = stock.filter((item) =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.itemCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold">{summary?.totalItems || 0}</p>
                </div>
                <div className="p-3 gradient-primary rounded-full shadow-md">
                  <PackageSearch className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Batches (GRN)</p>
                  <p className="text-2xl font-bold">{summary?.totalBatches || 0}</p>
                </div>
                <div className="p-3 bg-accent/10 rounded-full">
                  <Layers className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Stock Value (Cost)</p>
                  <p className="text-2xl font-bold font-mono-numbers">{formatCurrency(summary?.totalCostValue || 0, false)}</p>
                </div>
                <div className="p-3 bg-warning/10 rounded-full">
                  <TrendingDown className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Retail Value</p>
                  <p className="text-2xl font-bold font-mono-numbers text-primary">{formatCurrency(summary?.totalRetailValue || 0, false)}</p>
                </div>
                <div className="p-3 gradient-primary rounded-full shadow-md">
                  <TrendingUp className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stock Table */}
        <Card className="border-0 shadow-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 gradient-primary rounded-lg shadow-md">
                <PackageSearch className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">Live Stock</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Grouped by item with GRN batch details
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={fetchStock} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-3 text-muted-foreground">Loading stock...</span>
              </div>
            ) : stock.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-1">No Stock Available</h3>
                <p className="text-sm text-muted-foreground">Add items via GRN to see stock here</p>
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead className="text-right">Total Qty</TableHead>
                      <TableHead className="text-right">Total Weight (kg)</TableHead>
                      <TableHead className="text-right">Avg Wt/Unit</TableHead>
                      <TableHead className="text-right">Batches</TableHead>
                      <TableHead className="text-right">Stock Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStock.map((item) => {
                      const isExpanded = expandedItems.has(item.itemId);
                      
                      return (
                        <>
                          {/* Main Item Row */}
                          <TableRow 
                            key={item.itemId}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => toggleExpand(item.itemId)}
                          >
                            <TableCell>
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{item.itemCode}</TableCell>
                            <TableCell className="font-semibold">{item.itemName}</TableCell>
                            <TableCell className="text-right font-bold text-lg">{item.totalQty}</TableCell>
                            <TableCell className="text-right font-mono-numbers">{item.totalWeight.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-mono-numbers">{item.avgWeightPerUnit.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              <span className="px-2 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium">
                                {item.batchCount} GRN{item.batchCount > 1 ? 's' : ''}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-bold font-mono-numbers text-primary">
                              {formatCurrency(item.totalRetailValue)}
                            </TableCell>
                          </TableRow>
                          
                          {/* Expanded GRN Batch Rows */}
                          {isExpanded && item.batches.map((batch, batchIndex) => (
                            <TableRow 
                              key={`${item.itemId}-${batch.stockId}`}
                              className="bg-muted/30 border-l-4 border-l-primary/50"
                            >
                              <TableCell></TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                └ {batch.grnNumber}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {formatDate(batch.receivedDate)}
                              </TableCell>
                              <TableCell className="text-right font-medium">{batch.remainingQty}</TableCell>
                              <TableCell className="text-right font-mono-numbers text-sm">{batch.itemWeight.toFixed(2)}</TableCell>
                              <TableCell className="text-right text-muted-foreground text-sm">-</TableCell>
                              <TableCell className="text-right">
                                <span className="text-xs text-muted-foreground">
                                  Sell: {formatCurrency(batch.sellingPrice)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-mono-numbers text-sm">
                                {formatCurrency(batch.remainingQty * batch.sellingPrice)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredStock.length} of {stock.length} items • 
              Total Qty: <span className="font-semibold">{summary?.totalStockQty || 0}</span> • 
              Total Weight: <span className="font-semibold">{summary?.totalStockWeight?.toFixed(2) || 0} kg</span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default LiveStockPage;
