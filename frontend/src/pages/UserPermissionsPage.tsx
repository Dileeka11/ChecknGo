import { useState } from 'react';
import { Shield, Edit, Trash2, Plus, Save, X, Users } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useLoadingState } from '@/hooks/use-loading-state';
import { LoadingTable } from '@/components/ui/loading';

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface UserRole {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'cashier';
  permissions: string[];
  status: 'active' | 'inactive';
}

const AVAILABLE_PERMISSIONS: Permission[] = [
  { id: 'dashboard_view', name: 'View Dashboard', description: 'Access to sales dashboard and analytics' },
  { id: 'checkout', name: 'Process Checkout', description: 'Process customer transactions' },
  { id: 'items_manage', name: 'Manage Items', description: 'Add, edit, delete items' },
  { id: 'customers_manage', name: 'Manage Customers', description: 'Add, edit, delete customers' },
  { id: 'suppliers_manage', name: 'Manage Suppliers', description: 'Add, edit, delete suppliers' },
  { id: 'grn_create', name: 'Create GRN', description: 'Create goods received notes' },
  { id: 'stock_view', name: 'View Stock', description: 'View live stock levels' },
  { id: 'history_view', name: 'View History', description: 'View transaction history' },
  { id: 'users_manage', name: 'Manage Users', description: 'Add, edit user permissions' },
];

const INITIAL_USERS: UserRole[] = [
  {
    id: '1',
    name: 'John Manager',
    email: 'manager@store.com',
    role: 'manager',
    permissions: AVAILABLE_PERMISSIONS.map(p => p.id),
    status: 'active',
  },
  {
    id: '2',
    name: 'Sarah Cashier',
    email: 'cashier@store.com',
    role: 'cashier',
    permissions: ['checkout', 'stock_view', 'history_view'],
    status: 'active',
  },
  {
    id: '3',
    name: 'Mike Staff',
    email: 'staff@store.com',
    role: 'cashier',
    permissions: ['checkout', 'stock_view'],
    status: 'active',
  },
];

const UserPermissionsPage = () => {
  const isLoading = useLoadingState(800);
  const [users, setUsers] = useState<UserRole[]>(INITIAL_USERS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRole | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'cashier' as 'manager' | 'cashier',
    permissions: [] as string[],
    status: 'active' as 'active' | 'inactive',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'cashier',
      permissions: [],
      status: 'active',
    });
    setEditingUser(null);
  };

  const handleOpenDialog = (user?: UserRole) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        status: user.status,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handlePermissionToggle = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  const handleSave = () => {
    if (!formData.name || !formData.email) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (editingUser) {
      setUsers(users.map(u =>
        u.id === editingUser.id
          ? { ...u, ...formData }
          : u
      ));
      toast({
        title: 'User Updated',
        description: `${formData.name}'s permissions have been updated.`,
      });
    } else {
      const newUser: UserRole = {
        id: `user-${Date.now()}`,
        ...formData,
      };
      setUsers([...users, newUser]);
      toast({
        title: 'User Added',
        description: `${formData.name} has been added to the system.`,
      });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    const user = users.find(u => u.id === id);
    setUsers(users.filter(u => u.id !== id));
    toast({
      title: 'User Removed',
      description: `${user?.name} has been removed from the system.`,
    });
  };

  const handleToggleStatus = (id: string) => {
    setUsers(users.map(u =>
      u.id === id
        ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
        : u
    ));
  };

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <Card className="border-0 shadow-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 gradient-primary rounded-lg shadow-md">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">User Permissions</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage user access and permissions
                </p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? 'Edit User' : 'Add New User'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Enter email"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value: 'manager' | 'cashier') =>
                          setFormData({ ...formData, role: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="cashier">Cashier</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: 'active' | 'inactive') =>
                          setFormData({ ...formData, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Permissions</Label>
                    <div className="grid gap-3 p-4 border rounded-lg bg-secondary/30">
                      {AVAILABLE_PERMISSIONS.map((permission) => (
                        <div
                          key={permission.id}
                          className="flex items-start space-x-3"
                        >
                          <Checkbox
                            id={permission.id}
                            checked={formData.permissions.includes(permission.id)}
                            onCheckedChange={() => handlePermissionToggle(permission.id)}
                          />
                          <div className="flex flex-col">
                            <label
                              htmlFor={permission.id}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {permission.name}
                            </label>
                            <span className="text-xs text-muted-foreground">
                              {permission.description}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        resetForm();
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2" />
                      {editingUser ? 'Update' : 'Save'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingTable rows={4} columns={5} />
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user, index) => (
                      <TableRow 
                        key={user.id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md">
                              <Users className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'manager' ? 'default' : 'secondary'} className="capitalize">
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {user.permissions.slice(0, 3).map((p) => (
                              <Badge key={p} variant="outline" className="text-xs">
                                {AVAILABLE_PERMISSIONS.find(perm => perm.id === p)?.name || p}
                              </Badge>
                            ))}
                            {user.permissions.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{user.permissions.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(user.id)}
                            className={user.status === 'active' ? 'text-primary' : 'text-muted-foreground'}
                          >
                            <span className={`w-2 h-2 rounded-full mr-2 ${
                              user.status === 'active' ? 'bg-primary' : 'bg-muted-foreground'
                            }`} />
                            {user.status}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(user)}
                              className="hover:bg-primary/10"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(user.id)}
                              className="hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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

export default UserPermissionsPage;
