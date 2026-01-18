import { useState, useEffect, useCallback } from 'react';
import { Search, Calendar, ChevronDown, History as HistoryIcon, FileSpreadsheet, RefreshCw, Eye, XCircle, Receipt, Printer } from 'lucide-react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';
import { FRUIT_EMOJIS } from '@/data/mockData';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface InvoiceItem {
  itemName: string;
  quantity: number;
  weight: number;
  unitPrice: number;
  totalPrice: number;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paymentMethod: string;
  createdBy: string;
  status: 'completed' | 'cancelled';
  createdAt: string;
  cancelledAt?: string;
  cancelReason?: string;
}

const HistoryPage = () => {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL(`${API_BASE_URL}/api/invoices`);
      url.searchParams.set('limit', '100');
      
      const response = await fetch(url.toString());
      const data = await response.json();
      
      if (data.success) {
        setInvoices(data.data || []);
      } else {
        toast.error(data.error || 'Failed to fetch invoices');
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filterByDate = (invoice: Invoice) => {
    const invoiceDate = new Date(invoice.createdAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    switch (dateFilter) {
      case 'today':
        return invoiceDate >= today;
      case 'week':
        return invoiceDate >= weekAgo;
      case 'month':
        return invoiceDate >= monthAgo;
      default:
        return true;
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = searchQuery === '' || 
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.items.some(item => 
        item.itemName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesDate = filterByDate(invoice);
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesDate && matchesStatus;
  });

  const totalRevenue = filteredInvoices
    .filter(i => i.status === 'completed')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  
  const completedCount = filteredInvoices.filter(i => i.status === 'completed').length;
  const cancelledCount = filteredInvoices.filter(i => i.status === 'cancelled').length;

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailDialog(true);
  };

  const handleCancelClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setCancelReason('');
    setShowCancelDialog(true);
  };

  const handleCancelInvoice = async () => {
    if (!selectedInvoice) return;
    
    setCancelling(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/invoices/${selectedInvoice._id}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Invoice cancelled successfully');
        setShowCancelDialog(false);
        fetchInvoices();
      } else {
        toast.error(data.error || 'Failed to cancel invoice');
      }
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      toast.error('Failed to cancel invoice');
    } finally {
      setCancelling(false);
    }
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    const printWindow = window.open('', '', 'width=400,height=600');
    if (!printWindow) return;
    
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; font-size: 14px; }
          .header { text-align: center; margin-bottom: 16px; }
          .header h1 { font-size: 24px; margin: 0 0 4px 0; }
          .header p { margin: 2px 0; font-size: 12px; color: #666; }
          hr { border: none; border-top: 1px dashed #999; margin: 12px 0; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; }
          table { width: 100%; font-size: 12px; border-collapse: collapse; margin: 12px 0; }
          th, td { padding: 6px 4px; text-align: left; }
          th { border-bottom: 1px solid #ccc; font-weight: bold; }
          tr { border-bottom: 1px dashed #ddd; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .total { font-weight: bold; font-size: 16px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #333; }
          .footer { text-align: center; font-size: 12px; color: #666; margin-top: 16px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ChecknGo</h1>
          <p>AI-Powered Smart Checkout</p>
          <p>Fresh Produce Store</p>
          <p>Tel: +94 11 234 5678</p>
        </div>
        <hr>
        <div class="info-row"><span>Invoice No:</span><strong>${invoice.invoiceNumber}</strong></div>
        <div class="info-row"><span>Date:</span><span>${formatDate(invoice.createdAt)}</span></div>
        <div class="info-row"><span>Customer:</span><span>${invoice.customerName}</span></div>
        <div class="info-row"><span>Cashier:</span><span>${invoice.createdBy}</span></div>
        <hr>
        <table>
          <thead>
            <tr><th>Item</th><th class="text-center">Qty</th><th class="text-center">Wt(kg)</th><th class="text-right">Price</th></tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>${item.itemName}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-center">${item.weight.toFixed(2)}</td>
                <td class="text-right">Rs. ${item.totalPrice.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <hr>
        <div class="info-row"><span>Subtotal:</span><span>Rs. ${invoice.subtotal.toFixed(2)}</span></div>
        ${invoice.discount > 0 ? `<div class="info-row" style="color: green;"><span>Discount:</span><span>- Rs. ${invoice.discount.toFixed(2)}</span></div>` : ''}
        <div class="info-row total"><span>TOTAL:</span><span>Rs. ${invoice.totalAmount.toFixed(2)}</span></div>
        <hr>
        <div style="text-align: center; font-size: 12px;">Payment Method: <strong>${invoice.paymentMethod.toUpperCase()}</strong></div>
        <hr>
        <div class="footer">
          <p><strong>Thank you for shopping with us!</strong></p>
          <p>Fresh produce, smart checkout</p>
          <p style="margin-top: 8px;">* No returns on fresh produce *</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleExportCSV = () => {
    const headers = ['Invoice No', 'Date', 'Customer', 'Items', 'Qty', 'Weight (kg)', 'Total (Rs.)', 'Status', 'Cashier'];
    const rows = filteredInvoices.map(inv => [
      inv.invoiceNumber,
      new Date(inv.createdAt).toLocaleString(),
      inv.customerName,
      inv.items.map(i => i.itemName).join('; '),
      inv.items.reduce((sum, i) => sum + i.quantity, 0),
      inv.items.reduce((sum, i) => sum + i.weight, 0).toFixed(2),
      inv.totalAmount.toFixed(2),
      inv.status,
      inv.createdBy,
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
  };

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <Header />
      <main className="container px-4 py-6 md:px-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Transaction History</h1>
            <p className="text-muted-foreground mt-0.5">View, print, and manage your invoices</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchInvoices} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleExportCSV} variant="outline" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-soft">
            <CardContent className="pt-5 pb-4">
              <p className="text-sm text-muted-foreground">Total Transactions</p>
              <p className="text-2xl font-bold font-mono-numbers">{filteredInvoices.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-soft">
            <CardContent className="pt-5 pb-4">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold font-mono-numbers text-success">{completedCount}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-soft">
            <CardContent className="pt-5 pb-4">
              <p className="text-sm text-muted-foreground">Cancelled</p>
              <p className="text-2xl font-bold font-mono-numbers text-destructive">{cancelledCount}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-soft">
            <CardContent className="pt-5 pb-4">
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-2xl font-bold font-mono-numbers text-primary">{formatCurrency(totalRevenue, false)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice no or item..."
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="min-w-[130px] justify-between">
                    <span className="flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      {statusFilter === 'all' ? 'All Status' : 
                       statusFilter === 'completed' ? 'Completed' : 'Cancelled'}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setStatusFilter('all')}>All Status</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('completed')}>Completed</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('cancelled')}>Cancelled</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="border-0 shadow-elevated">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-md">
                <HistoryIcon className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">Invoices</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-3 text-muted-foreground">Loading invoices...</span>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-foreground">No invoices found</p>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filter</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Invoice</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date/Time</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Items</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cashier</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((invoice) => {
                      const { time, date } = formatDateTime(invoice.createdAt);
                      return (
                        <tr 
                          key={invoice._id} 
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <span className="font-semibold text-primary">{invoice.invoiceNumber}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-foreground">{time}</p>
                              <p className="text-xs text-muted-foreground">{date}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap gap-1">
                              {invoice.items.slice(0, 3).map((item, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary border border-border/30 text-xs font-medium"
                                >
                                  <span>{FRUIT_EMOJIS[item.itemName] || '🍎'}</span>
                                  {item.itemName}
                                </span>
                              ))}
                              {invoice.items.length > 3 && (
                                <span className="px-2 py-1 text-xs text-muted-foreground">
                                  +{invoice.items.length - 3} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-foreground">{invoice.createdBy}</span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="font-bold font-mono-numbers text-foreground">
                              {formatCurrency(invoice.totalAmount)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            {invoice.status === 'completed' ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                                Completed
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                                Cancelled
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleViewDetails(invoice)} title="View Details">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handlePrintInvoice(invoice)} title="Print">
                                <Printer className="h-4 w-4" />
                              </Button>
                              {invoice.status === 'completed' && (
                                <Button variant="ghost" size="icon" onClick={() => handleCancelClick(invoice)} title="Cancel Invoice" className="text-destructive hover:text-destructive">
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Invoice Details Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Invoice {selectedInvoice?.invoiceNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date(selectedInvoice.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedInvoice.customerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cashier</p>
                  <p className="font-medium">{selectedInvoice.createdBy}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment</p>
                  <p className="font-medium uppercase">{selectedInvoice.paymentMethod}</p>
                </div>
              </div>
              
              <div className="border rounded-lg p-3">
                <h4 className="font-semibold mb-2">Items</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Item</th>
                      <th className="text-center py-2">Qty</th>
                      <th className="text-center py-2">Weight</th>
                      <th className="text-right py-2">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-dashed">
                        <td className="py-2">{item.itemName}</td>
                        <td className="text-center py-2">{item.quantity}</td>
                        <td className="text-center py-2">{item.weight.toFixed(2)} kg</td>
                        <td className="text-right py-2">{formatCurrency(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedInvoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(selectedInvoice.totalAmount)}</span>
                </div>
              </div>

              {selectedInvoice.status === 'cancelled' && (
                <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <p className="text-sm font-medium text-destructive">Cancelled</p>
                  <p className="text-xs text-muted-foreground">Reason: {selectedInvoice.cancelReason}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Close</Button>
            {selectedInvoice && (
              <Button onClick={() => { handlePrintInvoice(selectedInvoice); }}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Invoice Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Cancel Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel invoice {selectedInvoice?.invoiceNumber}? 
              This will restore the stock quantities.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Cancellation Reason</label>
            <Input
              placeholder="Enter reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>Keep Invoice</Button>
            <Button variant="destructive" onClick={handleCancelInvoice} disabled={cancelling}>
              {cancelling ? 'Cancelling...' : 'Cancel Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HistoryPage;
