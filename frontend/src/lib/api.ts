const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface UserRole {
  _id?: string;
  id?: string; // for frontend compatibility
  name: string;
  email: string;
  role: 'manager' | 'cashier';
  permissions: string[];
  status: 'active' | 'inactive';
}

export interface UsersResponse {
  success: boolean;
  data: UserRole[];
  message?: string;
}

export interface UserResponse {
  success: boolean;
  data?: UserRole;
  message?: string;
}
export interface PredictionResponse {
  success: boolean;
  prediction?: {
    fruit: string;
    confidence: number;
    top5: Array<{ name: string; confidence: number }>;
  };
  error?: string;
}

export interface StockSearchResponse {
  success: boolean;
  inStock: boolean;
  data: {
    itemId: string;
    itemCode: string;
    itemName: string;
    availableWeight: number;
    fifoPrice: number;
    batchCount: number;
    batches: Array<{
      stockId: string;
      grnItemId: string;
      grnNumber: string;
      remainingWeight: number;
      sellingPrice: number;
      receivedDate: string;
    }>;
  } | null;
  message?: string;
}

export interface InvoiceCreateRequest {
  customerId?: string;
  customerName?: string;
  items: Array<{
    itemId: string;
    itemCode: string;
    itemName: string;
    weight: number;
  }>;
  discount?: number;
  paymentMethod?: 'cash' | 'card';
  createdBy: string;
}

export interface InvoiceResponse {
  success: boolean;
  data?: {
    _id: string;
    invoiceNumber: string;
    customerName: string;
    items: Array<{
      itemId: string;
      itemCode: string;
      itemName: string;
      weight: number;
      unitPrice: number;
      totalPrice: number;
    }>;
    subtotal: number;
    discount: number;
    totalAmount: number;
    paymentMethod: string;
    createdBy: string;
    status: string;
    createdAt: string;
  };
  message?: string;
  error?: string;
}

/**
 * Call the backend AI model to predict fruit/vegetable from image
 */
export const predictFruit = async (imageData: string): Promise<PredictionResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageData }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Prediction API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to server',
    };
  }
};

/**
 * Search stock by item name to check availability (weight-based)
 */
export const searchStockByName = async (name: string): Promise<StockSearchResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stock/search?name=${encodeURIComponent(name)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Stock search API error:', error);
    return {
      success: false,
      inStock: false,
      data: null,
      message: error instanceof Error ? error.message : 'Failed to connect to server',
    };
  }
};

/**
 * Create a new invoice (weight-based)
 */
export const createInvoice = async (invoiceData: InvoiceCreateRequest): Promise<InvoiceResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Create invoice API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to server',
    };
  }
};

/**
 * Cancel an invoice
 */
export const cancelInvoice = async (invoiceId: string, reason?: string): Promise<InvoiceResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}/cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Cancel invoice API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to server',
    };
  }
};

/**
 * Get invoice by ID
 */
export const getInvoiceById = async (invoiceId: string): Promise<InvoiceResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get invoice API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to server',
    };
  }
};

export interface WeightReadResponse {
  success: boolean;
  weight?: number;
  unit?: string;
  detectedText?: string;
  confidence?: number;
  error?: string;
}

/**
 * Read weight from scale camera image using OCR
 */
export const readWeightFromImage = async (imageData: string): Promise<WeightReadResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/weight/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageData }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Weight OCR API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to read weight',
    };
  }
};

/**
 * Get dashboard stats
 */
export const getDashboardStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return await response.json();
  } catch (error) {
    console.error('API error:', error);
    return { success: false, data: null };
  }
};

/**
 * Get dashboard recent transactions
 */
export const getDashboardRecentTransactions = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/recent-transactions`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return await response.json();
  } catch (error) {
    console.error('API error:', error);
    return { success: false, data: [] };
  }
};

/**
 * Get dashboard daily sales
 */
export const getDashboardDailySales = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/daily-sales`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return await response.json();
  } catch (error) {
    console.error('API error:', error);
    return { success: false, data: [] };
  }
};

/**
 * Get dashboard top sellers
 */
export const getDashboardTopSellers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/top-sellers`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return await response.json();
  } catch (error) {
    console.error('API error:', error);
    return { success: false, data: [] };
  }
};

/**
 * Get all users
 */
export const getUsers = async (): Promise<UsersResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return await response.json();
  } catch (error) {
    console.error('API error:', error);
    return { success: false, data: [] };
  }
};

/**
 * Create a new user
 */
export const createUser = async (userData: Partial<UserRole>): Promise<UserResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return await response.json();
  } catch (error) {
    console.error('API error:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Server error' };
  }
};

/**
 * Update a user
 */
export const updateUser = async (userId: string, userData: Partial<UserRole>): Promise<UserResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return await response.json();
  } catch (error) {
    console.error('API error:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Server error' };
  }
};

/**
 * Delete a user
 */
export const deleteUser = async (userId: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    return await response.json();
  } catch (error) {
    console.error('API error:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Server error' };
  }
};

/**
 * Login user with email and password
 */
export const loginUser = async (email: string, password: string): Promise<{
  success: boolean;
  data?: {
    _id: string;
    name: string;
    email: string;
    role: 'manager' | 'cashier';
    permissions: string[];
    status: 'active' | 'inactive';
  };
  token?: string;
  message?: string;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return await response.json();
  } catch (error) {
    console.error('Login API error:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Failed to connect to server' };
  }
};
