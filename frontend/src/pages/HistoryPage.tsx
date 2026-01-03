import { useState, useMemo } from 'react';
import { Download, Search, Calendar, ChevronDown, History as HistoryIcon, FileSpreadsheet } from 'lucide-react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Transaction } from '@/types';
import { generateMockTransactions, FRUIT_EMOJIS } from '@/data/mockData';
import { formatCurrency } from '@/lib/currency';
import { useLoadingState } from '@/hooks/use-loading-state';
import { LoadingTable, LoadingCard } from '@/components/ui/loading';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const HistoryPage = () => {
  const isLoading = useLoadingState(1000);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const allTransactions = useMemo(() => generateMockTransactions(), []);

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(txn => {
      const matchesSearch = searchQuery === '' || 
        txn.items.some(item => 
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchesSearch;
    });
  }, [allTransactions, searchQuery]);

  const totalRevenue = filteredTransactions.reduce((sum, txn) => sum + txn.totalAmount, 0);

  const handleExportCSV = () => {
    const headers = ['Time', 'Items', 'Weight (kg)', 'Total (Rs.)', 'Staff'];
    const rows = filteredTransactions.map(txn => [
      txn.timestamp.toLocaleString(),
      txn.items.map(i => i.name).join(', '),
      txn.items.reduce((sum, i) => sum + i.weight, 0).toFixed(2),
      txn.totalAmount.toFixed(2),
      txn.staffName,
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <Header />
      <main className="container px-4 py-6 md:px-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-down">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Transaction History</h1>
            <p className="text-muted-foreground mt-0.5">View and export your past transactions</p>
          </div>
          <Button onClick={handleExportCSV} variant="outline" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {isLoading ? (
          <>
            {/* Loading Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-0 shadow-soft animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
                  <CardContent className="pt-5 pb-4">
                    <div className="h-4 w-24 bg-muted rounded mb-2" />
                    <div className="h-8 w-20 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Loading Filters */}
            <Card className="border-0 shadow-soft">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="h-10 flex-1 bg-muted rounded animate-pulse" />
                  <div className="h-10 w-[150px] bg-muted rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>

            {/* Loading Table */}
            <Card className="border-0 shadow-elevated">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
                  <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                </div>
              </CardHeader>
              <CardContent>
                <LoadingTable rows={6} columns={6} />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="border-0 shadow-soft animate-slide-up">
                <CardContent className="pt-5 pb-4">
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold font-mono-numbers">{filteredTransactions.length}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-soft animate-slide-up stagger-1">
                <CardContent className="pt-5 pb-4">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold font-mono-numbers text-primary">{formatCurrency(totalRevenue, false)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-soft hidden md:block animate-slide-up stagger-2">
                <CardContent className="pt-5 pb-4">
                  <p className="text-sm text-muted-foreground">Avg. Transaction</p>
                  <p className="text-2xl font-bold font-mono-numbers">
                    {formatCurrency(filteredTransactions.length > 0 ? totalRevenue / filteredTransactions.length : 0, false)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="border-0 shadow-soft animate-slide-up stagger-3">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by item name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="min-w-[150px] justify-between">
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {dateFilter === 'today' ? 'Today' : 
                           dateFilter === 'week' ? 'This Week' : 
                           dateFilter === 'month' ? 'This Month' : 'All Time'}
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setDateFilter('today')}>Today</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDateFilter('week')}>This Week</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDateFilter('month')}>This Month</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDateFilter('all')}>All Time</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card className="border-0 shadow-elevated animate-slide-up stagger-4">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-md">
                    <HistoryIcon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="text-lg font-semibold">Transactions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Items</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Staff</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Weight</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((txn, index) => (
                        <tr 
                          key={txn.id} 
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors group animate-fade-in"
                          style={{ animationDelay: `${index * 0.03}s` }}
                        >
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-foreground">
                                {txn.timestamp.toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {txn.timestamp.toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap gap-1">
                              {txn.items.map((item, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary border border-border/30 text-xs font-medium"
                                >
                                  <span>{FRUIT_EMOJIS[item.name] || '🍎'}</span>
                                  {item.name}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-foreground">{txn.staffName}</span>
                          </td>
                          <td className="py-4 px-4 text-center font-mono-numbers text-muted-foreground">
                            {txn.items.reduce((sum, i) => sum + i.weight, 0).toFixed(2)} kg
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="font-bold font-mono-numbers text-foreground group-hover:text-primary transition-colors">
                              {formatCurrency(txn.totalAmount)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                              Completed
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredTransactions.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                      <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-medium text-foreground">No transactions found</p>
                    <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filter</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default HistoryPage;
