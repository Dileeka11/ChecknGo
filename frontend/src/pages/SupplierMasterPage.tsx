import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, Truck, RefreshCw } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { LoadingTable } from '@/components/ui/loading';

const API_BASE_URL = 'http://localhost:5000/api';

interface Supplier {
  _id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  contactPerson: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  contactPerson: string;
}

const SupplierMasterPage = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteSupplier, setDeleteSupplier] = useState<Supplier | null>(null);
  const [nextCode, setNextCode] = useState('');
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
  });

  // Fetch all suppliers
  const fetchSuppliers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/suppliers`);
      const result = await response.json();
      
      if (result.success) {
        setSuppliers(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch suppliers',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch next code for new supplier
  const fetchNextCode = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/suppliers/next-code`);
      const result = await response.json();
      
      if (result.success) {
        setNextCode(result.data.nextCode);
      }
    } catch (error) {
      console.error('Failed to fetch next code:', error);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      contactPerson: '',
    });
    setEditingSupplier(null);
    setNextCode('');
  };

  const handleOpenDialog = async (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        contactPerson: supplier.contactPerson,
      });
    } else {
      resetForm();
      await fetchNextCode();
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteSupplier) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/suppliers/${deleteSupplier._id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      
      if (result.success) {
        setSuppliers(suppliers.filter((s) => s._id !== deleteSupplier._id));
        toast({
          title: 'Supplier Deleted',
          description: 'The supplier has been removed successfully.',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete supplier',
        variant: 'destructive',
      });
    } finally {
      setDeleteSupplier(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingSupplier) {
        const response = await fetch(`${API_BASE_URL}/suppliers/${editingSupplier._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const result = await response.json();
        
        if (result.success) {
          setSuppliers(suppliers.map((s) => 
            s._id === editingSupplier._id ? result.data : s
          ));
          toast({
            title: 'Supplier Updated',
            description: 'The supplier has been updated successfully.',
          });
        } else {
          throw new Error(result.error);
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/suppliers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const result = await response.json();
        
        if (result.success) {
          setSuppliers([result.data, ...suppliers]);
          toast({
            title: 'Supplier Added',
            description: `New supplier ${result.data.code} has been added successfully.`,
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
        description: error.message || 'Failed to save supplier',
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
                <Truck className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">Supplier Master</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage your supplier database
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={fetchSuppliers} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2" onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4" />
                    Add Supplier
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="code">Supplier Code</Label>
                        <Input
                          id="code"
                          value={editingSupplier ? editingSupplier.code : nextCode}
                          disabled
                          className="bg-muted"
                          placeholder="Auto-generated"
                        />
                        <p className="text-xs text-muted-foreground">
                          {editingSupplier ? 'Code cannot be changed' : 'Will be auto-generated'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="name">Supplier Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="Fresh Farms Ltd"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="contact@supplier.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone *</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          placeholder="+94114567890"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPerson">Contact Person *</Label>
                      <Input
                        id="contactPerson"
                        value={formData.contactPerson}
                        onChange={(e) =>
                          setFormData({ ...formData, contactPerson: e.target.value })
                        }
                        placeholder="Mr. Silva"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address *</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        placeholder="10 Industrial Zone, Colombo"
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
                        {isSaving ? 'Saving...' : editingSupplier ? 'Update' : 'Add'} Supplier
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
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {filteredSuppliers.length} supplier{filteredSuppliers.length !== 1 ? 's' : ''} found
              </p>
            </div>
            
            {isLoading ? (
              <LoadingTable rows={6} columns={6} />
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact Person</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuppliers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No suppliers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSuppliers.map((supplier, index) => (
                        <TableRow 
                          key={supplier._id}
                          className="animate-fade-in"
                          style={{ animationDelay: `${index * 0.03}s` }}
                        >
                          <TableCell className="font-medium">{supplier.code}</TableCell>
                          <TableCell>{supplier.name}</TableCell>
                          <TableCell>{supplier.contactPerson}</TableCell>
                          <TableCell>{supplier.email}</TableCell>
                          <TableCell>{supplier.phone}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(supplier)}
                                className="hover:bg-primary/10"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteSupplier(supplier)}
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
      <AlertDialog open={!!deleteSupplier} onOpenChange={(open) => !open && setDeleteSupplier(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the supplier &quot;{deleteSupplier?.name}&quot; ({deleteSupplier?.code}). 
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

export default SupplierMasterPage;
