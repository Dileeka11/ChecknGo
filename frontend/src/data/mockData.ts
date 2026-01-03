import { Transaction, TopSeller, DailySales, FruitItem, Item, Customer, Supplier, GRN, StockItem } from '@/types';

// Prices per kg for all 36 fruits/vegetables the AI model recognizes
export const FRUIT_PRICES: Record<string, number> = {
  'Apple': 200,
  'Banana': 80,
  'Beetroot': 60,
  'Bell Pepper': 150,
  'Cabbage': 40,
  'Capsicum': 120,
  'Carrot': 80,
  'Cauliflower': 70,
  'Chilli Pepper': 200,
  'Corn': 50,
  'Cucumber': 40,
  'Eggplant': 60,
  'Garlic': 300,
  'Ginger': 250,
  'Grapes': 250,
  'Jalepeno': 180,
  'Kiwi': 400,
  'Lemon': 120,
  'Lettuce': 100,
  'Mango': 300,
  'Onion': 50,
  'Orange': 150,
  'Paprika': 180,
  'Pear': 200,
  'Peas': 100,
  'Pineapple': 180,
  'Pomegranate': 280,
  'Potato': 40,
  'Raddish': 60,
  'Soy Beans': 120,
  'Spinach': 80,
  'Sweetcorn': 70,
  'Sweetpotato': 50,
  'Tomato': 60,
  'Turnip': 50,
  'Watermelon': 50,
};

export const FRUIT_EMOJIS: Record<string, string> = {
  'Apple': '🍎',
  'Banana': '🍌',
  'Beetroot': '🥬',
  'Bell Pepper': '🫑',
  'Cabbage': '🥬',
  'Capsicum': '🫑',
  'Carrot': '🥕',
  'Cauliflower': '🥦',
  'Chilli Pepper': '🌶️',
  'Corn': '🌽',
  'Cucumber': '🥒',
  'Eggplant': '🍆',
  'Garlic': '🧄',
  'Ginger': '🫚',
  'Grapes': '🍇',
  'Jalepeno': '🌶️',
  'Kiwi': '🥝',
  'Lemon': '🍋',
  'Lettuce': '🥬',
  'Mango': '🥭',
  'Onion': '🧅',
  'Orange': '🍊',
  'Paprika': '🌶️',
  'Pear': '🍐',
  'Peas': '🫛',
  'Pineapple': '🍍',
  'Pomegranate': '🍎',
  'Potato': '🥔',
  'Raddish': '🥬',
  'Soy Beans': '🫘',
  'Spinach': '🥬',
  'Sweetcorn': '🌽',
  'Sweetpotato': '🍠',
  'Tomato': '🍅',
  'Turnip': '🥬',
  'Watermelon': '🍉',
};

const STAFF_NAMES = ['Priya Sharma', 'Rahul Kumar', 'Anita Patel', 'Vikram Singh'];
const STAFF_IDS = ['user-1', 'user-2', 'user-3', 'user-4'];

export const generateMockTransactions = (): Transaction[] => {
  const fruits = Object.keys(FRUIT_PRICES);
  const transactions: Transaction[] = [];
  
  for (let i = 0; i < 20; i++) {
    const itemCount = Math.floor(Math.random() * 3) + 1;
    const items: FruitItem[] = [];
    const staffIndex = Math.floor(Math.random() * STAFF_NAMES.length);
    
    for (let j = 0; j < itemCount; j++) {
      const fruitName = fruits[Math.floor(Math.random() * fruits.length)];
      const weight = Math.round((Math.random() * 2 + 0.2) * 10) / 10;
      const unitPrice = FRUIT_PRICES[fruitName];
      
      items.push({
        id: `item-${i}-${j}`,
        name: fruitName,
        confidence: Math.round((Math.random() * 10 + 90) * 10) / 10,
        weight,
        unitPrice,
        totalPrice: Math.round(weight * unitPrice * 100) / 100,
        timestamp: new Date(Date.now() - Math.random() * 86400000),
      });
    }
    
    transactions.push({
      id: `txn-${i}`,
      items,
      totalAmount: items.reduce((sum, item) => sum + item.totalPrice, 0),
      timestamp: new Date(Date.now() - i * 1800000),
      status: 'completed',
      staffId: STAFF_IDS[staffIndex],
      staffName: STAFF_NAMES[staffIndex],
    });
  }
  
  return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const generateTopSellers = (): TopSeller[] => {
  return [
    { name: 'Apple', quantity: 45, revenue: 9000, icon: '🍎' },
    { name: 'Banana', quantity: 38, revenue: 3040, icon: '🍌' },
    { name: 'Mango', quantity: 28, revenue: 8400, icon: '🥭' },
    { name: 'Orange', quantity: 25, revenue: 3750, icon: '🍊' },
    { name: 'Grapes', quantity: 20, revenue: 5000, icon: '🍇' },
  ];
};

export const generateDailySales = (): DailySales[] => {
  const sales: DailySales[] = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    sales.push({
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      total: Math.round(Math.random() * 10000 + 5000),
      itemCount: Math.floor(Math.random() * 100 + 50),
    });
  }
  
  return sales;
};

export const simulatePrediction = async (): Promise<{ fruit: string; confidence: number }> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const fruits = Object.keys(FRUIT_PRICES);
  const fruit = fruits[Math.floor(Math.random() * fruits.length)];
  const confidence = Math.round((Math.random() * 5 + 95) * 10) / 10;
  
  return { fruit, confidence };
};

export const simulateWeightReading = (): number => {
  return Math.round((Math.random() * 2 + 0.3) * 10) / 10;
};

// Item Master Mock Data
export const generateMockItems = (): Item[] => {
  const items: Item[] = [
    { id: 'item-1', code: 'FRT001', name: 'Apple', category: 'Fruits', unit: 'kg', costPrice: 150, sellingPrice: 200, reorderLevel: 50, createdAt: new Date('2024-01-01'), updatedAt: new Date() },
    { id: 'item-2', code: 'FRT002', name: 'Banana', category: 'Fruits', unit: 'kg', costPrice: 50, sellingPrice: 80, reorderLevel: 100, createdAt: new Date('2024-01-01'), updatedAt: new Date() },
    { id: 'item-3', code: 'FRT003', name: 'Orange', category: 'Fruits', unit: 'kg', costPrice: 100, sellingPrice: 150, reorderLevel: 60, createdAt: new Date('2024-01-01'), updatedAt: new Date() },
    { id: 'item-4', code: 'FRT004', name: 'Mango', category: 'Fruits', unit: 'kg', costPrice: 200, sellingPrice: 300, reorderLevel: 40, createdAt: new Date('2024-01-01'), updatedAt: new Date() },
    { id: 'item-5', code: 'FRT005', name: 'Grapes', category: 'Fruits', unit: 'kg', costPrice: 180, sellingPrice: 250, reorderLevel: 30, createdAt: new Date('2024-01-01'), updatedAt: new Date() },
    { id: 'item-6', code: 'VEG001', name: 'Tomato', category: 'Vegetables', unit: 'kg', costPrice: 30, sellingPrice: 50, reorderLevel: 80, createdAt: new Date('2024-01-01'), updatedAt: new Date() },
    { id: 'item-7', code: 'VEG002', name: 'Potato', category: 'Vegetables', unit: 'kg', costPrice: 25, sellingPrice: 40, reorderLevel: 100, createdAt: new Date('2024-01-01'), updatedAt: new Date() },
    { id: 'item-8', code: 'VEG003', name: 'Onion', category: 'Vegetables', unit: 'kg', costPrice: 35, sellingPrice: 55, reorderLevel: 100, createdAt: new Date('2024-01-01'), updatedAt: new Date() },
  ];
  return items;
};

// Customer Master Mock Data
export const generateMockCustomers = (): Customer[] => {
  return [
    { id: 'cust-1', code: 'CUST001', name: 'John Doe', email: 'john@example.com', phone: '+94771234567', address: '123 Main St, Colombo', createdAt: new Date('2024-01-15') },
    { id: 'cust-2', code: 'CUST002', name: 'Jane Smith', email: 'jane@example.com', phone: '+94772345678', address: '456 Oak Ave, Kandy', createdAt: new Date('2024-02-10') },
    { id: 'cust-3', code: 'CUST003', name: 'Kumar Perera', email: 'kumar@example.com', phone: '+94773456789', address: '789 Palm Rd, Galle', createdAt: new Date('2024-03-05') },
  ];
};

// Supplier Master Mock Data
export const generateMockSuppliers = (): Supplier[] => {
  return [
    { id: 'sup-1', code: 'SUP001', name: 'Fresh Farms Ltd', email: 'contact@freshfarms.com', phone: '+94114567890', address: '10 Industrial Zone, Colombo', contactPerson: 'Mr. Silva', createdAt: new Date('2024-01-01') },
    { id: 'sup-2', code: 'SUP002', name: 'Green Valley Produce', email: 'sales@greenvalley.com', phone: '+94115678901', address: '25 Farm Road, Nuwara Eliya', contactPerson: 'Mrs. Fernando', createdAt: new Date('2024-01-05') },
    { id: 'sup-3', code: 'SUP003', name: 'Tropical Fruits Co', email: 'info@tropicalfruits.com', phone: '+94116789012', address: '88 Orchard Lane, Kurunegala', contactPerson: 'Mr. Jayasuriya', createdAt: new Date('2024-02-01') },
  ];
};

// GRN Mock Data
export const generateMockGRNs = (): GRN[] => {
  return [
    {
      id: 'grn-1',
      grnNumber: 'GRN-2024-001',
      supplierId: 'sup-1',
      supplierName: 'Fresh Farms Ltd',
      items: [
        { id: 'grn-item-1', itemId: 'item-1', itemName: 'Apple', quantity: 100, listPrice: 160, discount: 10, sellingPrice: 200, totalCost: 14400 },
        { id: 'grn-item-2', itemId: 'item-2', itemName: 'Banana', quantity: 150, listPrice: 55, discount: 5, sellingPrice: 80, totalCost: 7837.5 },
      ],
      totalAmount: 22237.5,
      receivedDate: new Date('2024-12-20'),
      createdBy: 'Priya Sharma',
      status: 'received',
    },
    {
      id: 'grn-2',
      grnNumber: 'GRN-2024-002',
      supplierId: 'sup-2',
      supplierName: 'Green Valley Produce',
      items: [
        { id: 'grn-item-3', itemId: 'item-6', itemName: 'Tomato', quantity: 80, listPrice: 35, discount: 5, sellingPrice: 50, totalCost: 2660 },
        { id: 'grn-item-4', itemId: 'item-7', itemName: 'Potato', quantity: 200, listPrice: 28, discount: 3, sellingPrice: 40, totalCost: 5432 },
      ],
      totalAmount: 8092,
      receivedDate: new Date('2024-12-22'),
      createdBy: 'Rahul Kumar',
      status: 'received',
    },
  ];
};

// Stock Mock Data
export const generateMockStock = (): StockItem[] => {
  const items = generateMockItems();
  return items.map((item, index) => ({
    id: `stock-${index + 1}`,
    itemId: item.id,
    itemCode: item.code,
    itemName: item.name,
    category: item.category,
    quantity: Math.floor(Math.random() * 200) + 20,
    unit: item.unit,
    costPrice: item.costPrice,
    sellingPrice: item.sellingPrice,
    reorderLevel: item.reorderLevel,
    lastUpdated: new Date(),
  }));
};
