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
  quantity: number;
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

// GRN (Goods Received Note)
export interface GRNItem {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
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

// Stock
export interface StockItem {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  lastUpdated: Date;
}
