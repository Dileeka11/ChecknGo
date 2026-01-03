import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Leaf, LayoutDashboard, History, ShoppingCart, Clock, LogOut, User, 
  Package, Users, Truck, FileText, PackageSearch, ChevronDown, Shield,
  FolderOpen, Database, BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface NavCategory {
  label: string;
  icon: React.ElementType;
  path?: string;
  managerOnly?: boolean;
  children?: {
    path: string;
    label: string;
    icon: React.ElementType;
    managerOnly?: boolean;
  }[];
}

const Header = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [openMobileMenu, setOpenMobileMenu] = useState<string | null>(null);
  
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const navCategories: NavCategory[] = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      managerOnly: true 
    },
    {
      label: 'Master Files',
      icon: FolderOpen,
      managerOnly: true,
      children: [
        { path: '/items', label: 'Item Master', icon: Package, managerOnly: true },
        { path: '/customers', label: 'Customer Master', icon: Users, managerOnly: true },
        { path: '/suppliers', label: 'Supplier Master', icon: Truck, managerOnly: true },
      ],
    },
    {
      label: 'Data Capture',
      icon: Database,
      children: [
        { path: '/', label: 'Checkout', icon: ShoppingCart },
        { path: '/grn', label: 'GRN', icon: FileText, managerOnly: true },
      ],
    },
    {
      label: 'Reports',
      icon: BarChart3,
      children: [
        { path: '/stock', label: 'Live Stock', icon: PackageSearch },
        { path: '/history', label: 'History', icon: History },
      ],
    },
    { 
      path: '/permissions', 
      label: 'User Permissions', 
      icon: Shield, 
      managerOnly: true 
    },
  ];

  const filterNavItems = (categories: NavCategory[]) => {
    return categories.filter(category => {
      if (category.managerOnly && user?.role !== 'manager') return false;
      if (category.children) {
        category.children = category.children.filter(
          child => !child.managerOnly || user?.role === 'manager'
        );
        return category.children.length > 0;
      }
      return true;
    });
  };

  const filteredCategories = filterNavItems(navCategories);

  const isPathActive = (path: string) => location.pathname === path;
  const isCategoryActive = (category: NavCategory) => {
    if (category.path) return isPathActive(category.path);
    return category.children?.some(child => isPathActive(child.path));
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 glass-strong">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-primary shadow-lg group-hover:shadow-glow transition-all duration-300 group-hover:scale-105">
            <Leaf className="h-6 w-6 text-primary-foreground animate-pulse-soft" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gradient">ChecknGo</span>
            <span className="text-[10px] text-muted-foreground hidden sm:block font-medium tracking-wide">AI-Powered Smart Checkout</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {filteredCategories.map((category) => {
            const isActive = isCategoryActive(category);
            
            if (category.path) {
              return (
                <Link key={category.path} to={category.path}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className={cn('gap-2', isActive && 'shadow-md')}
                  >
                    <category.icon className="h-4 w-4" />
                    {category.label}
                  </Button>
                </Link>
              );
            }

            return (
              <DropdownMenu key={category.label}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className={cn('gap-2', isActive && 'shadow-md')}
                  >
                    <category.icon className="h-4 w-4" />
                    {category.label}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {category.children?.map((child) => (
                    <DropdownMenuItem key={child.path} asChild>
                      <Link 
                        to={child.path} 
                        className={cn(
                          'flex items-center gap-2 cursor-pointer',
                          isPathActive(child.path) && 'bg-primary/10 text-primary'
                        )}
                      >
                        <child.icon className="h-4 w-4" />
                        {child.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
        </nav>

        {/* User & Date/Time & Theme */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-sm px-3 py-2 rounded-xl bg-secondary/50">
            <Clock className="h-4 w-4 text-primary" />
            <div className="flex flex-col items-end">
              <span className="font-semibold text-foreground font-mono-numbers">{currentTime}</span>
              <span className="text-[10px] text-muted-foreground">{currentDate}</span>
            </div>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 rounded-xl border-border/50 hover:border-primary/30 transition-all">
                  <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center shadow-sm">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="hidden sm:inline font-medium">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 p-2">
                <DropdownMenuLabel className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md">
                      <User className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold">{user.name}</span>
                      <span className="text-xs font-normal text-muted-foreground capitalize">{user.role}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer rounded-lg mt-1">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="lg:hidden border-t border-border bg-card px-2 py-2 space-y-1">
        {filteredCategories.map((category) => {
          const isActive = isCategoryActive(category);
          
          if (category.path) {
            return (
              <Link key={category.path} to={category.path} className="block">
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className={cn('w-full justify-start gap-2', isActive && 'shadow-md')}
                >
                  <category.icon className="h-4 w-4" />
                  {category.label}
                </Button>
              </Link>
            );
          }

          return (
            <Collapsible 
              key={category.label}
              open={openMobileMenu === category.label}
              onOpenChange={(open) => setOpenMobileMenu(open ? category.label : null)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className={cn('w-full justify-between gap-2', isActive && 'shadow-md')}
                >
                  <span className="flex items-center gap-2">
                    <category.icon className="h-4 w-4" />
                    {category.label}
                  </span>
                  <ChevronDown className={cn(
                    'h-4 w-4 transition-transform',
                    openMobileMenu === category.label && 'rotate-180'
                  )} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 pt-1 space-y-1">
                {category.children?.map((child) => (
                  <Link key={child.path} to={child.path} className="block">
                    <Button
                      variant={isPathActive(child.path) ? 'secondary' : 'ghost'}
                      size="sm"
                      className="w-full justify-start gap-2"
                    >
                      <child.icon className="h-4 w-4" />
                      {child.label}
                    </Button>
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </nav>
    </header>
  );
};

export default Header;
