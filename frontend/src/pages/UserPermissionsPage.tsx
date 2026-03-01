import { useState, useEffect } from 'react';
import { Shield, Edit, Trash2, Plus, Save, X, Users, Eye, EyeOff } from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser, UserRole } from '@/lib/api';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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

const UserPermissionsPage = () => {
  const [users, setUsers] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRole | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier' as 'manager' | 'cashier',
    permissions: [] as string[],
    status: 'active' as 'active' | 'inactive',
  });
  const [showPassword, setShowPassword] = useState(false);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'cashier',
      permissions: [],
      status: 'active',
    });
    setShowPassword(false);
    setEditingUser(null);
  };

  const handleOpenDialog = (user?: UserRole) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
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

  const fetchUsers = async () => {
    setIsLoading(true);
    const res = await getUsers();
    if (res.success) {
      setUsers(res.data);
    } else {
      toast({
        title: 'Error Fetching Users',
        description: res.message || 'Could not fetch users',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    // Password is required only when creating a new user
    if (!editingUser && !formData.password) {
      toast({
        title: 'Validation Error',
        description: 'Password is required for new users.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password && formData.password.length < 6) {
      toast({
        title: 'Validation Error',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    if (editingUser) {
      const editingId = editingUser._id || editingUser.id;
      if (!editingId) return;

      // Only send password if it was changed
      const updateData = { ...formData };
      if (!updateData.password) {
        delete (updateData as any).password;
      }
      const res = await updateUser(editingId, updateData);
      if (res.success) {
        setUsers(users.map(u =>
          (u._id === editingId || u.id === editingId)
            ? { ...u, ...formData }
            : u
        ));
        toast({
          title: 'User Updated',
          description: `${formData.name}'s permissions have been updated.`,
        });
      } else {
        toast({
          title: 'Error Updating User',
          description: res.message,
          variant: 'destructive',
        });
      }
    } else {
      const res = await createUser(formData);
      if (res.success && res.data) {
        setUsers([...users, res.data]);
        toast({
          title: 'User Added',
          description: `${formData.name} has been added to the system.`,
        });
      } else {
        toast({
          title: 'Error Adding User',
          description: res.message,
          variant: 'destructive',
        });
      }
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    const user = users.find(u => u._id === id || u.id === id);
    const res = await deleteUser(id);
    if (res.success) {
      setUsers(users.filter(u => u._id !== id && u.id !== id));
      toast({
        title: 'User Removed',
        description: `${user?.name} has been removed from the system.`,
      });
    } else {
      toast({
        title: 'Error Removing User',
        description: res.message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (user: UserRole) => {
    const id = user._id || user.id;
    if (!id) return;

    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const res = await updateUser(id, { status: newStatus });
    
    if (res.success) {
      setUsers(users.map(u =>
        (u._id === id || u.id === id)
          ? { ...u, status: newStatus }
          : u
      ));
    } else {
      toast({
        title: 'Error Updating Status',
        description: res.message,
        variant: 'destructive',
      });
    }
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

                  {/* Password field */}
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Password {editingUser ? '(leave blank to keep current)' : '*'}
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder={editingUser ? '••••••••' : 'Enter password (min 6 characters)'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
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
                        key={user._id || user.id}
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
                            onClick={() => handleToggleStatus(user)}
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
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove {user.name}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(user._id || user.id || '')}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
