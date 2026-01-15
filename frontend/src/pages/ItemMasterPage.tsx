import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, Package, RefreshCw } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Item } from '@/types';
import { formatCurrency } from '@/lib/currency';
import { LoadingTable } from '@/components/ui/loading';

const API_BASE_URL = 'http://localhost:5000/api';

const ItemMasterPage = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deleteItem, setDeleteItem] = useState<Item | null>(null);
  const [nextCode, setNextCode] = useState('');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    category: 'Fruits',
    unit: 'kg',
    costPrice: '',
    sellingPrice: '',
    reorderLevel: '',
  });

  const fetchItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/items`);
      const result = await response.json();
      
      if (result.success) {
        // Map _id to id for frontend compatibility
        const mappedItems = result.data.map((item: any) => ({
          ...item,
          id: item._id
        }));
        setItems(mappedItems);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch items',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchNextCode = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/items/next-code`);
      const result = await response.json();
      
      if (result.success) {
        setNextCode(result.data.nextCode);
      }
    } catch (error) {
      console.error('Failed to fetch next code:', error);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Fruits',
      unit: 'kg',
      costPrice: '',
      sellingPrice: '',
      reorderLevel: '',
    });
    setEditingItem(null);
    setNextCode('');
  };

  const handleOpenDialog = async (item?: Item) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category,
        unit: item.unit,
        costPrice: item.costPrice.toString(),
        sellingPrice: item.sellingPrice.toString(),
        reorderLevel: item.reorderLevel.toString(),
      });
    } else {
      resetForm();
      await fetchNextCode();
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      const response = await fetch(`${API_BASE_URL}/items/${deleteItem.id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        setItems(items.filter((item) => item.id !== deleteItem.id));
        toast({
          title: 'Item Deleted',
          description: 'The item has been removed successfully.',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete item',
        variant: 'destructive',
      });
    } finally {
      setDeleteItem(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      ...formData,
      costPrice: parseFloat(formData.costPrice),
      sellingPrice: parseFloat(formData.sellingPrice),
      reorderLevel: parseInt(formData.reorderLevel),
    };

    try {
      if (editingItem) {
        const response = await fetch(`${API_BASE_URL}/items/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await response.json();

        if (result.success) {
          const updatedItem = { ...result.data, id: result.data._id };
          setItems(items.map((item) => 
            item.id === editingItem.id ? updatedItem : item
          ));
          toast({
            title: 'Item Updated',
            description: 'The item has been updated successfully.',
          });
        } else {
          throw new Error(result.error);
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await response.json();

        if (result.success) {
          const newItem = { ...result.data, id: result.data._id };
          setItems([newItem, ...items]);
          toast({
            title: 'Item Added',
            description: 'New item has been added successfully.',
          });
        } else {
          throw new Error(result.error);
        }
      }

      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save item',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <Card className="border-0 shadow-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 gradient-primary rounded-lg shadow-md">
                <Package className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">Item Master</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage your products and prices
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={fetchItems} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2" onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? 'Edit Item' : 'Add New Item'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Item Code</Label>
                      <Input
                        id="code"
                        value={editingItem ? editingItem.code : nextCode}
                        disabled
                        className="bg-muted"
                        placeholder="Auto-generated"
                      />
                      <p className="text-xs text-muted-foreground">
                        {editingItem ? 'Code cannot be changed' : 'Will be auto-generated'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Item Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Apple"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) =>
                            setFormData({ ...formData, category: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Fruits">Fruits</SelectItem>
                            <SelectItem value="Vegetables">Vegetables</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unit">Unit</Label>
                        <Select
                          value={formData.unit}
                          onValueChange={(value) =>
                            setFormData({ ...formData, unit: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">Kilogram (kg)</SelectItem>
                            <SelectItem value="g">Gram (g)</SelectItem>
                            <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="costPrice">Cost Price (Rs.)</Label>
                        <Input
                          id="costPrice"
                          type="number"
                          value={formData.costPrice}
                          onChange={(e) =>
                            setFormData({ ...formData, costPrice: e.target.value })
                          }
                          placeholder="150"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sellingPrice">Selling Price (Rs.)</Label>
                        <Input
                          id="sellingPrice"
                          type="number"
                          value={formData.sellingPrice}
                          onChange={(e) =>
                            setFormData({ ...formData, sellingPrice: e.target.value })
                          }
                          placeholder="200"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reorderLevel">Reorder Level</Label>
                      <Input
                        id="reorderLevel"
                        type="number"
                        value={formData.reorderLevel}
                        onChange={(e) =>
                          setFormData({ ...formData, reorderLevel: e.target.value })
                        }
                        placeholder="50"
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          resetForm();
                          setIsDialogOpen(false);
                        }}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? 'Saving...' : editingItem ? 'Update' : 'Add'} Item
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found
              </p>
            </div>
            
            {isLoading ? (
              <LoadingTable rows={8} columns={8} />
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Cost Price</TableHead>
                      <TableHead className="text-right">Selling Price</TableHead>
                      <TableHead className="text-right">Reorder Level</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No items found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item, index) => (
                        <TableRow 
                          key={item.id}
                          className="animate-fade-in"
                          style={{ animationDelay: `${index * 0.03}s` }}
                        >
                          <TableCell className="font-medium">{item.code}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.category === 'Fruits' 
                                ? 'bg-warning/10 text-warning' 
                                : 'bg-primary/10 text-primary'
                            }`}>
                              {item.category}
                            </span>
                          </TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell className="text-right font-mono-numbers">{formatCurrency(item.costPrice)}</TableCell>
                          <TableCell className="text-right font-mono-numbers">{formatCurrency(item.sellingPrice)}</TableCell>
                          <TableCell className="text-right">{item.reorderLevel}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(item)}
                                className="hover:bg-primary/10"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteItem(item)}
                                className="hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the item &quot;{deleteItem?.name}&quot; ({deleteItem?.code}). 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ItemMasterPage;
