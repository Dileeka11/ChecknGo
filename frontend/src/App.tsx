import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/hooks/use-theme";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import CheckoutPage from "./pages/CheckoutPage";
import DashboardPage from "./pages/DashboardPage";
import HistoryPage from "./pages/HistoryPage";
import LoginPage from "./pages/LoginPage";
import ItemMasterPage from "./pages/ItemMasterPage";
import CustomerMasterPage from "./pages/CustomerMasterPage";
import SupplierMasterPage from "./pages/SupplierMasterPage";
import GRNPage from "./pages/GRNPage";
import LiveStockPage from "./pages/LiveStockPage";
import UserPermissionsPage from "./pages/UserPermissionsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute requiredRole="manager"><DashboardPage /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
              <Route path="/items" element={<ProtectedRoute requiredRole="manager"><ItemMasterPage /></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute requiredRole="manager"><CustomerMasterPage /></ProtectedRoute>} />
              <Route path="/suppliers" element={<ProtectedRoute requiredRole="manager"><SupplierMasterPage /></ProtectedRoute>} />
              <Route path="/grn" element={<ProtectedRoute requiredRole="manager"><GRNPage /></ProtectedRoute>} />
              <Route path="/stock" element={<ProtectedRoute><LiveStockPage /></ProtectedRoute>} />
              <Route path="/permissions" element={<ProtectedRoute requiredRole="manager"><UserPermissionsPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
