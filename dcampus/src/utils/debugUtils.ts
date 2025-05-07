// Debug utility functions to help diagnose issues

/**
 * Debug HTTP requests to identify issues with API communication
 * @param url The URL being called
 * @param method The HTTP method
 * @param requestData Optional request data
 * @param responseData Optional response data
 * @param error Optional error
 */
export const debugApiCall = (
  url: string,
  method: string,
  requestData?: any,
  responseData?: any,
  error?: any
): void => {
  // Only log in development mode
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  console.group(`🔍 API Call Debug: ${method} ${url}`);
  
  console.log('Request:', {
    url,
    method,
    headers: requestData?.headers,
    data: requestData?.data
  });
  
  if (error) {
    console.error('Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  } else {
    console.log('Response:', responseData);
  }
  
  console.groupEnd();
};

/**
 * Debug connection status with the backend
 * @param apiUrl The backend API URL to test
 * @returns Promise with connection status data
 */
export const debugBackendConnection = async (
  apiUrl: string = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
): Promise<{ connected: boolean; status?: number; data?: any; error?: string }> => {
  try {
    const response = await fetch(`${apiUrl.replace(/\/+$/, '')}/health`);
    const data = await response.json();
    
    console.log('🔌 Backend Connection Test:', {
      connected: response.ok,
      status: response.status,
      data
    });
    
    return {
      connected: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    console.error('🔌 Backend Connection Failed:', error);
    return { 
      connected: false, 
      error: (error as Error).message 
    };
  }
};