import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, FileText, Save, Search, RefreshCw } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { GRN, GRNItem, Supplier, Item } from '@/types';
import { LoadingTable } from '@/components/ui/loading';

const API_BASE_URL = 'http://localhost:5000/api';

const GRNPage = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [grns, setGrns] = useState<GRN[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [isLoadingGRNs, setIsLoadingGRNs] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // New GRN form state
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [grnItems, setGrnItems] = useState<GRNItem[]>([]);
  const [showNewGRN, setShowNewGRN] = useState(false);

  // Item entry form
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [listPrice, setListPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');

  // Item search modal
  const [itemSearchOpen, setItemSearchOpen] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  // Supplier search modal
  const [supplierSearchOpen, setSupplierSearchOpen] = useState(false);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');

  const fetchSuppliers = useCallback(async () => {
    try {
      setIsLoadingSuppliers(true);
      const response = await fetch(`${API_BASE_URL}/suppliers`);
      const result = await response.json();
      
      if (result.success) {
        const mappedSuppliers = result.data.map((supplier: any) => ({
          ...supplier,
          id: supplier._id
        }));
        setSuppliers(mappedSuppliers);
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load suppliers',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSuppliers(false);
    }
  }, [toast]);

  const fetchItems = useCallback(async () => {
    try {
      setIsLoadingItems(true);
      const response = await fetch(`${API_BASE_URL}/items`);
      const result = await response.json();
      
      if (result.success) {
        const mappedItems = result.data.map((item: any) => ({
          ...item,
          id: item._id
        }));
        setItems(mappedItems);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load items',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingItems(false);
    }
  }, [toast]);

  const fetchGRNs = useCallback(async () => {
    try {
      setIsLoadingGRNs(true);
      const response = await fetch(`${API_BASE_URL}/grns`);
      const result = await response.json();
      
      if (result.success) {
        const mappedGRNs = result.data.map((grn: any) => ({
          ...grn,
          id: grn._id,
          receivedDate: new Date(grn.receivedDate)
        }));
        setGrns(mappedGRNs);
      }
    } catch (error) {
      console.error('Failed to fetch GRNs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load GRNs',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingGRNs(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSuppliers();
    fetchItems();
    fetchGRNs();
  }, [fetchSuppliers, fetchItems, fetchGRNs]);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
    item.code.toLowerCase().includes(itemSearchQuery.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(supplierSearchQuery.toLowerCase()) ||
    supplier.code.toLowerCase().includes(supplierSearchQuery.toLowerCase())
  );

  const handleSelectItem = (item: Item) => {
    setSelectedItemId(item.id);
    setListPrice(item.costPrice.toString());
    setSellingPrice(item.sellingPrice.toString());
    setItemSearchOpen(false);
    setItemSearchQuery('');
  };

  const handleSelectSupplier = (supplier: Supplier) => {
    setSelectedSupplierId(supplier.id);
    setSupplierSearchOpen(false);
    setSupplierSearchQuery('');
  };

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);
  const selectedItem = items.find(i => i.id === selectedItemId);

  const calculateTotalCost = () => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(listPrice) || 0;
    const disc = parseFloat(discount) || 0;
    return qty * price * (1 - disc / 100);
  };

  const handleAddItem = () => {
    if (!selectedItemId || !quantity || !listPrice || !sellingPrice) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all item details.',
        variant: 'destructive',
      });
      return;
    }

    const newItem: GRNItem = {
      id: `grn-item-${Date.now()}`,
      itemId: selectedItemId,
      itemName: selectedItem?.name || '',
      quantity: parseFloat(quantity),
      listPrice: parseFloat(listPrice),
      discount: parseFloat(discount) || 0,
      sellingPrice: parseFloat(sellingPrice),
      totalCost: calculateTotalCost(),
    };

    setGrnItems([...grnItems, newItem]);
    
    // Reset item form
    setSelectedItemId('');
    setQuantity('');
    setListPrice('');
    setDiscount('');
    setSellingPrice('');
  };

  const handleRemoveItem = (id: string) => {
    setGrnItems(grnItems.filter(item => item.id !== id));
  };

  const handleSaveGRN = async () => {
    if (!selectedSupplierId || grnItems.length === 0) {
      toast({
        title: 'Cannot Save GRN',
        description: 'Please select a supplier and add at least one item.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      // Prepare items with proper structure for backend
      const itemsForBackend = grnItems.map(item => {
        const itemDetails = items.find(i => i.id === item.itemId);
        return {
          itemId: item.itemId,
          itemCode: itemDetails?.code || '',
          itemName: item.itemName,
          quantity: item.quantity,
          listPrice: item.listPrice,
          discount: item.discount,
          sellingPrice: item.sellingPrice,
          totalCost: item.totalCost,
        };
      });

      const payload = {
        supplierId: selectedSupplierId,
        supplierName: selectedSupplier?.name || '',
        items: itemsForBackend,
        receivedDate: new Date().toISOString(),
        createdBy: user?.name || 'Unknown',
        status: 'received',
      };

      const response = await fetch(`${API_BASE_URL}/grns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        const newGRN = {
          ...result.data,
          id: result.data._id,
          receivedDate: new Date(result.data.receivedDate)
        };
        setGrns([newGRN, ...grns]);
        
        // Reset form
        setSelectedSupplierId('');
        setGrnItems([]);
        setShowNewGRN(false);

        toast({
          title: 'GRN Created',
          description: `GRN ${result.data.grnNumber} has been saved successfully.`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save GRN',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const totalAmount = grnItems.reduce((sum, item) => sum + item.totalCost, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* New GRN Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <FileText className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-2xl">Goods Received Note (GRN)</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Record incoming stock from suppliers
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={fetchGRNs} disabled={isLoadingGRNs}>
                <RefreshCw className={`h-4 w-4 ${isLoadingGRNs ? 'animate-spin' : ''}`} />
              </Button>
              {!showNewGRN && (
                <Button onClick={() => setShowNewGRN(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  New GRN
                </Button>
              )}
            </div>
          </CardHeader>

          {showNewGRN && (
            <CardContent className="space-y-6">
              {/* Supplier Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Select Supplier</Label>
                  <Dialog open={supplierSearchOpen} onOpenChange={setSupplierSearchOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        {selectedSupplier ? (
                          <span>{selectedSupplier.code} - {selectedSupplier.name}</span>
                        ) : (
                          <span className="text-muted-foreground">Select supplier...</span>
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Select Supplier</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search by name or code..."
                            value={supplierSearchQuery}
                            onChange={(e) => setSupplierSearchQuery(e.target.value)}
                            className="pl-10"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto rounded-md border">
                          {isLoadingSuppliers ? (
                            <div className="p-8 text-center text-muted-foreground">Loading suppliers...</div>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Code</TableHead>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Contact</TableHead>
                                  <TableHead></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredSuppliers.length > 0 ? (
                                  filteredSuppliers.map((supplier) => (
                                    <TableRow key={supplier.id} className="cursor-pointer hover:bg-muted/50">
                                      <TableCell className="font-medium">{supplier.code}</TableCell>
                                      <TableCell>{supplier.name}</TableCell>
                                      <TableCell className="text-muted-foreground">{supplier.phone}</TableCell>
                                      <TableCell>
                                        <Button
                                          size="sm"
                                          onClick={() => handleSelectSupplier(supplier)}
                                        >
                                          Select
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                      No suppliers found
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="space-y-2">
                  <Label>GRN Date</Label>
                  <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>

              {/* Add Item Form */}
              <Card className="bg-muted/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Add Item</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label>Item</Label>
                      <Dialog open={itemSearchOpen} onOpenChange={setItemSearchOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            {selectedItem ? (
                              <span>{selectedItem.code} - {selectedItem.name}</span>
                            ) : (
                              <span className="text-muted-foreground">Select item...</span>
                            )}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Select Item</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Search by name or code..."
                                value={itemSearchQuery}
                                onChange={(e) => setItemSearchQuery(e.target.value)}
                                className="pl-10"
                                autoFocus
                              />
                            </div>
                            <div className="max-h-[300px] overflow-y-auto rounded-md border">
                              {isLoadingItems ? (
                                <div className="p-8 text-center text-muted-foreground">Loading items...</div>
                              ) : (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Code</TableHead>
                                      <TableHead>Name</TableHead>
                                      <TableHead className="text-right">Price</TableHead>
                                      <TableHead></TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {filteredItems.length > 0 ? (
                                      filteredItems.map((item) => (
                                        <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                                          <TableCell className="font-medium">{item.code}</TableCell>
                                          <TableCell>{item.name}</TableCell>
                                          <TableCell className="text-right">Rs. {item.sellingPrice.toFixed(2)}</TableCell>
                                          <TableCell>
                                            <Button
                                              size="sm"
                                              onClick={() => handleSelectItem(item)}
                                            >
                                              Add
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))
                                    ) : (
                                      <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                          No items found
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>List Price</Label>
                      <Input
                        type="number"
                        value={listPrice}
                        onChange={(e) => setListPrice(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Discount %</Label>
                      <Input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Selling Price</Label>
                      <Input
                        type="number"
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-muted-foreground">
                      Total Cost: <span className="font-semibold text-foreground">Rs. {calculateTotalCost().toFixed(2)}</span>
                    </div>
                    <Button onClick={handleAddItem} size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add to GRN
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* GRN Items Table */}
              {grnItems.length > 0 && (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">List Price</TableHead>
                        <TableHead className="text-right">Discount %</TableHead>
                        <TableHead className="text-right">Selling Price</TableHead>
                        <TableHead className="text-right">Total Cost</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grnItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.itemName}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">Rs. {item.listPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{item.discount}%</TableCell>
                          <TableCell className="text-right">Rs. {item.sellingPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-semibold">Rs. {item.totalCost.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* GRN Summary */}
              <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg">
                <div className="text-lg font-semibold">
                  Grand Total: <span className="text-primary">Rs. {totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => {
                    setShowNewGRN(false);
                    setSelectedSupplierId('');
                    setGrnItems([]);
                  }} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveGRN} className="gap-2" disabled={isSaving}>
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save GRN'}
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Previous GRNs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent GRNs</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingGRNs ? (
              <LoadingTable rows={6} columns={7} />
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>GRN Number</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No GRNs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      grns.map((grn) => (
                        <TableRow key={grn.id}>
                          <TableCell className="font-medium">{grn.grnNumber}</TableCell>
                          <TableCell>{grn.supplierName}</TableCell>
                          <TableCell>{grn.items.length} items</TableCell>
                          <TableCell className="text-right font-semibold">Rs. {grn.totalAmount.toFixed(2)}</TableCell>
                          <TableCell>{grn.receivedDate.toLocaleDateString()}</TableCell>
                          <TableCell>{grn.createdBy}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              grn.status === 'received' 
                                ? 'bg-green-100 text-green-700' 
                                : grn.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {grn.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default GRNPage;
