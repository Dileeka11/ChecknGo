export interface FruitItem {
  id: string;
  name: string;
  confidence: number;
  weight: number;
  unitPrice: number;
  totalPrice: number;
  timestamp: Date;
  imageUrl?: string;
}

export interface Transaction {
  id: string;
  items: FruitItem[];
  totalAmount: number;
  timestamp: Date;
  status: 'pending' | 'completed' | 'cancelled';
  staffId: string;
  staffName: string;
}

export interface DailySales {
  date: string;
  total: number;
  itemCount: number;
}

export interface TopSeller {
  name: string;
  weight: number;
  revenue: number;
  icon?: string;
}

export type CameraStatus = 'ready' | 'processing' | 'identified' | 'error';

export interface PredictionResult {
  fruit: string;
  confidence: number;
  unitPrice: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'manager' | 'staff';
  avatar?: string;
  permissions?: string[];
}

// Item Master
export interface Item {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

// Customer Master
export interface Customer {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: Date;
}

// Supplier Master
export interface Supplier {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  contactPerson: string;
  createdAt: Date;
}

// GRN (Goods Received Note) - Weight-based
export interface GRNItem {
  id: string;
  itemId: string;
  itemName: string;
  totalWeight: number;
  listPrice: number;
  discount: number;
  sellingPrice: number;
  totalCost: number;
}

export interface GRN {
  id: string;
  grnNumber: string;
  supplierId: string;
  supplierName: string;
  items: GRNItem[];
  totalAmount: number;
  receivedDate: Date;
  createdBy: string;
  status: 'pending' | 'received' | 'cancelled';
}

// Stock - Weight-based
export interface StockItem {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  category: string;
  totalWeight: number;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  lastUpdated: Date;
}

// Stock Availability (for checkout) - Weight-based
export interface StockBatch {
  stockId: string;
  grnItemId: string;
  grnNumber: string;
  remainingWeight: number;
  sellingPrice: number;
  receivedDate: string;
}

export interface StockAvailability {
  itemId: string;
  itemCode: string;
  itemName: string;
  availableWeight: number;
  fifoPrice: number;
  batchCount: number;
  batches: StockBatch[];
}

// Invoice - Weight-based
export interface StockDeduction {
  grnItemId: string;
  stockId: string;
  weightDeducted: number;
  priceApplied: number;
}

export interface InvoiceItem {
  id?: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  weight: number;
  unitPrice: number;
  totalPrice: number;
  deductions?: StockDeduction[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'card';
  createdBy: string;
  status: 'completed' | 'cancelled';
  createdAt: Date;
  cancelledAt?: Date;
  cancelReason?: string;
}
