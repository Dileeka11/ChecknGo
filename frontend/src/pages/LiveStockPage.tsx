import { useState } from 'react';
import { Search, PackageSearch, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StockItem } from '@/types';
import { generateMockStock } from '@/data/mockData';
import { formatCurrency } from '@/lib/currency';
import { useLoadingState } from '@/hooks/use-loading-state';
import { LoadingTable } from '@/components/ui/loading';

const LiveStockPage = () => {
  const isLoading = useLoadingState(1000);
  const [stock] = useState<StockItem[]>(generateMockStock());
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredStock = stock.filter((item) => {
    const matchesSearch =
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalItems = stock.length;
  const lowStockItems = stock.filter((item) => item.quantity <= item.reorderLevel).length;
  const totalStockValue = stock.reduce((sum, item) => sum + item.quantity * item.costPrice, 0);
  const totalRetailValue = stock.reduce((sum, item) => sum + item.quantity * item.sellingPrice, 0);

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6">
        {isLoading ? (
          <>
            {/* Loading Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-4 w-20 bg-muted rounded" />
                        <div className="h-8 w-16 bg-muted rounded" />
                      </div>
                      <div className="h-12 w-12 bg-muted rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Loading Stock Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-muted rounded-lg animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                  <div className="h-10 flex-1 max-w-sm bg-muted rounded animate-pulse" />
                  <div className="h-10 w-[180px] bg-muted rounded animate-pulse" />
                  <div className="h-10 w-28 bg-muted rounded animate-pulse" />
                </div>
                <LoadingTable rows={8} columns={9} />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="animate-slide-up border-0 shadow-soft">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Items</p>
                      <p className="text-2xl font-bold">{totalItems}</p>
                    </div>
                    <div className="p-3 gradient-primary rounded-full shadow-md">
                      <PackageSearch className="h-6 w-6 text-primary-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="animate-slide-up stagger-1 border-0 shadow-soft">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Low Stock Alert</p>
                      <p className="text-2xl font-bold text-destructive">{lowStockItems}</p>
                    </div>
                    <div className="p-3 bg-destructive/10 rounded-full">
                      <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="animate-slide-up stagger-2 border-0 shadow-soft">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Stock Value (Cost)</p>
                      <p className="text-2xl font-bold font-mono-numbers">{formatCurrency(totalStockValue, false)}</p>
                    </div>
                    <div className="p-3 bg-warning/10 rounded-full">
                      <TrendingDown className="h-6 w-6 text-warning" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="animate-slide-up stagger-3 border-0 shadow-soft">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Retail Value</p>
                      <p className="text-2xl font-bold font-mono-numbers text-primary">{formatCurrency(totalRetailValue, false)}</p>
                    </div>
                    <div className="p-3 gradient-primary rounded-full shadow-md">
                      <TrendingUp className="h-6 w-6 text-primary-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stock Table */}
            <Card className="animate-slide-up stagger-4 border-0 shadow-elevated">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 gradient-primary rounded-lg shadow-md">
                    <PackageSearch className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Live Stock</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Current inventory levels
                    </p>
                  </div>
                </div>
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
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Fruits">Fruits</SelectItem>
                      <SelectItem value="Vegetables">Vegetables</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => window.print()}>
                    Export Report
                  </Button>
                </div>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">Cost Price</TableHead>
                        <TableHead className="text-right">Selling Price</TableHead>
                        <TableHead className="text-right">Stock Value</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStock.map((item, index) => {
                        const isLowStock = item.quantity <= item.reorderLevel;
                        const stockValue = item.quantity * item.costPrice;
                        
                        return (
                          <TableRow 
                            key={item.id} 
                            className={`${isLowStock ? 'bg-destructive/5' : ''} animate-fade-in`}
                            style={{ animationDelay: `${index * 0.03}s` }}
                          >
                            <TableCell className="font-medium">{item.itemCode}</TableCell>
                            <TableCell>{item.itemName}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.category === 'Fruits' 
                                  ? 'bg-warning/10 text-warning' 
                                  : 'bg-primary/10 text-primary'
                              }`}>
                                {item.category}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-semibold">{item.quantity}</TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell className="text-right font-mono-numbers">{formatCurrency(item.costPrice)}</TableCell>
                            <TableCell className="text-right font-mono-numbers">{formatCurrency(item.sellingPrice)}</TableCell>
                            <TableCell className="text-right font-semibold font-mono-numbers">{formatCurrency(stockValue)}</TableCell>
                            <TableCell>
                              {isLowStock ? (
                                <div className="flex items-center gap-1 text-destructive">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span className="text-xs font-medium">Low Stock</span>
                                </div>
                              ) : (
                                <span className="text-xs font-medium text-primary">In Stock</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  Showing {filteredStock.length} of {stock.length} items
                  {lowStockItems > 0 && (
                    <span className="ml-4 text-destructive">
                      • {lowStockItems} item(s) below reorder level
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default LiveStockPage;
