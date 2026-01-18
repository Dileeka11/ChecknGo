const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
    availableQty: number;
    availableWeight: number;
    avgWeightPerUnit: number;
    fifoPrice: number;
    batchCount: number;
    batches: Array<{
      stockId: string;
      grnItemId: string;
      grnNumber: string;
      remainingQty: number;
      itemWeight: number;
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
    quantity: number;
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
      quantity: number;
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
 * Search stock by item name to check availability
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
 * Create a new invoice
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
