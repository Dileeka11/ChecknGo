import { useState, useCallback, useEffect, useRef } from 'react';
import { UserPlus, Mail, User, Loader2, CheckCircle2, Search, Phone, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { quickAddCustomer, searchCustomers, CustomerSearchResult } from '@/lib/api';
import { cn } from '@/lib/utils';

interface QuickAddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerAdded: (customer: { _id: string; name: string; email: string }) => void;
}

type TabMode = 'search' | 'add';

const QuickAddCustomerDialog = ({
  open,
  onOpenChange,
  onCustomerAdded,
}: QuickAddCustomerDialogProps) => {
  const [activeTab, setActiveTab] = useState<TabMode>('search');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Add new state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (value.trim().length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await searchCustomers(value.trim());
        if (response.success) {
          setSearchResults(response.data);
        }
      } catch {
        // silently fail
      } finally {
        setSearching(false);
        setHasSearched(true);
      }
    }, 300);
  }, []);

  const handleSelectCustomer = useCallback((customer: CustomerSearchResult) => {
    onCustomerAdded({
      _id: customer._id,
      name: customer.name,
      email: customer.email,
    });
    toast.success(`Customer "${customer.name}" selected`);
    resetAndClose();
  }, [onCustomerAdded]);

  const handleAddNew = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      toast.error('Please fill in both name and email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSaving(true);
    try {
      const response = await quickAddCustomer(name.trim(), email.trim());

      if (response.success && response.data) {
        if (response.existing) {
          toast.info(`Customer "${response.data.name}" already exists — linked to this bill`);
        } else {
          toast.success(`Customer "${response.data.name}" added successfully!`);
        }
        onCustomerAdded({
          _id: response.data._id,
          name: response.data.name,
          email: response.data.email,
        });
        resetAndClose();
      } else {
        toast.error(response.error || 'Failed to add customer');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetAndClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setName('');
    setEmail('');
    setActiveTab('search');
    onOpenChange(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSearchResults([]);
      setHasSearched(false);
      setName('');
      setEmail('');
      setActiveTab('search');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
              <UserPlus className="h-4 w-4 text-white" />
            </div>
            Customer
          </DialogTitle>
          <DialogDescription>
            Search for an existing customer or add a new one.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-muted p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === 'search'
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Search className="h-4 w-4" />
            Search Existing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('add')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === 'add'
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <UserPlus className="h-4 w-4" />
            Add New
          </button>
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone, or code..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-11 pl-10"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSearchResults([]); setHasSearched(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto max-h-[300px] min-h-[120px]">
              {searching ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((customer) => (
                    <button
                      key={customer._id}
                      type="button"
                      onClick={() => handleSelectCustomer(customer)}
                      className="w-full flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-muted/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200 text-left group"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/60 transition-colors">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-foreground truncate">{customer.name}</p>
                          <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded shrink-0">{customer.code}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 mt-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                            <Mail className="h-3 w-3 shrink-0" /> {customer.email}
                          </p>
                          {customer.phone && customer.phone !== 'N/A' && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                              <Phone className="h-3 w-3 shrink-0" /> {customer.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : hasSearched ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Search className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No customers found</p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setActiveTab('add')}
                    className="mt-1 text-emerald-600"
                  >
                    Add new customer →
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Search className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">Type to search customers</p>
                  <p className="text-xs text-muted-foreground mt-1">Search by name, email, phone number, or customer code</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add New Tab */}
        {activeTab === 'add' && (
          <form onSubmit={handleAddNew} className="space-y-4 py-1">
            <div className="space-y-2">
              <Label htmlFor="quick-customer-name" className="flex items-center gap-2 text-sm font-medium">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Customer Name
              </Label>
              <Input
                id="quick-customer-name"
                placeholder="Enter customer name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
                autoFocus
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-customer-email" className="flex items-center gap-2 text-sm font-medium">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Email Address
              </Label>
              <Input
                id="quick-customer-email"
                type="email"
                placeholder="customer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={saving}
                className="h-11"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={resetAndClose}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || !name.trim() || !email.trim()}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Save Customer
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuickAddCustomerDialog;
