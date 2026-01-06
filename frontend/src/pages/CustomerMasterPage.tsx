import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, Users, RefreshCw } from 'lucide-react';
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

interface Customer {
  _id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

const CustomerMasterPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
  const [nextCode, setNextCode] = useState('');
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  // Fetch all customers
  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/customers`);
      const result = await response.json();
      
      if (result.success) {
        setCustomers(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch customers',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch next code for new customer
  const fetchNextCode = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/next-code`);
      const result = await response.json();
      
      if (result.success) {
        setNextCode(result.data.nextCode);
      }
    } catch (error) {
      console.error('Failed to fetch next code:', error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
    });
    setEditingCustomer(null);
    setNextCode('');
  };

  const handleOpenDialog = async (customer?: Customer) => {
    if (customer) {
      // Edit mode
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
      });
    } else {
      // Add mode - fetch next code
      resetForm();
      await fetchNextCode();
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteCustomer) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${deleteCustomer._id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      
      if (result.success) {
        setCustomers(customers.filter((c) => c._id !== deleteCustomer._id));
        toast({
          title: 'Customer Deleted',
          description: 'The customer has been removed successfully.',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete customer',
        variant: 'destructive',
      });
    } finally {
      setDeleteCustomer(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingCustomer) {
        // Update existing customer
        const response = await fetch(`${API_BASE_URL}/customers/${editingCustomer._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const result = await response.json();
        
        if (result.success) {
          setCustomers(customers.map((c) => 
            c._id === editingCustomer._id ? result.data : c
          ));
          toast({
            title: 'Customer Updated',
            description: 'The customer has been updated successfully.',
          });
        } else {
          throw new Error(result.error);
        }
      } else {
        // Create new customer
        const response = await fetch(`${API_BASE_URL}/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const result = await response.json();
        
        if (result.success) {
          setCustomers([result.data, ...customers]);
          toast({
            title: 'Customer Added',
            description: `New customer ${result.data.code} has been added successfully.`,
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
        description: error.message || 'Failed to save customer',
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
                <Users className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">Customer Master</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage your customer database
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={fetchCustomers} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2" onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4" />
                    Add Customer
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="code">Customer Code</Label>
                        <Input
                          id="code"
                          value={editingCustomer ? editingCustomer.code : nextCode}
                          disabled
                          className="bg-muted"
                          placeholder="Auto-generated"
                        />
                        <p className="text-xs text-muted-foreground">
                          {editingCustomer ? 'Code cannot be changed' : 'Will be auto-generated'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="name">Customer Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="John Doe"
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
                          placeholder="john@example.com"
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
                          placeholder="+94771234567"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address *</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        placeholder="123 Main St, Colombo"
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
                        {isSaving ? 'Saving...' : editingCustomer ? 'Update' : 'Add'} Customer
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
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} found
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
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No customers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCustomers.map((customer, index) => (
                        <TableRow 
                          key={customer._id}
                          className="animate-fade-in"
                          style={{ animationDelay: `${index * 0.03}s` }}
                        >
                          <TableCell className="font-medium">{customer.code}</TableCell>
                          <TableCell>{customer.name}</TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell>{customer.phone}</TableCell>
                          <TableCell className="max-w-xs truncate">{customer.address}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(customer)}
                                className="hover:bg-primary/10"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteCustomer(customer)}
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
      <AlertDialog open={!!deleteCustomer} onOpenChange={(open) => !open && setDeleteCustomer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the customer &quot;{deleteCustomer?.name}&quot; ({deleteCustomer?.code}). 
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

export default CustomerMasterPage;
