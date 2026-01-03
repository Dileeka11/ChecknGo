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
