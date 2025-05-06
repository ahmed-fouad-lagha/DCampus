import { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse, InternalAxiosRequestConfig, AxiosHeaders } from 'axios';

/**
 * Configuration options for AI service
 */
export interface AIServiceConfig {
  apiKey?: string;
  baseURL?: string;
  modelVersion?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retryCount?: number;
}

/**
 * Standard response structure for AI operations
 */
export interface AIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    processingTime?: number;
    modelVersion?: string;
    requestId?: string;
  };
}

/**
 * Error types from the AI service
 */
export enum AIErrorType {
  AUTHENTICATION = 'authentication_error',
  PERMISSION = 'permission_error',
  RATE_LIMIT = 'rate_limit_error',
  VALIDATION = 'validation_error',
  SERVER = 'server_error',
  NETWORK = 'network_error',
  UNKNOWN = 'unknown_error'
}

/**
 * Custom error class for AI service errors
 */
export class AIServiceError extends Error {
  public readonly type: AIErrorType;
  public readonly statusCode?: number;
  public readonly details?: any;
  public readonly requestId?: string;
  
  constructor(message: string, type: AIErrorType = AIErrorType.UNKNOWN, statusCode?: number, details?: any, requestId?: string) {
    super(message);
    this.name = 'AIServiceError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    this.requestId = requestId;
    
    // Ensure proper prototype chain for ES5 environments
    Object.setPrototypeOf(this, AIServiceError.prototype);
  }
}

/**
 * Type for Axios request configuration with metadata
 */
interface RequestConfigWithMetadata extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: number;
    [key: string]: any;
  };
}

/**
 * Base class for AI-related services
 */
class AIService {
  private config: AIServiceConfig;
  private apiInstance: AxiosInstance | null = null;
  
  constructor(config: AIServiceConfig = {}) {
    this.config = {
      baseURL: process.env.REACT_APP_AI_API_URL || 'https://api.example.com/ai',
      timeout: 30000, // 30 seconds default timeout
      retryCount: 1, // Default retry once on failure
      ...config
    };
  }

  /**
   * Initialize the API client
   * Should be called before making any requests
   */
  protected async initializeClient(): Promise<void> {
    if (this.apiInstance) return;
    
    try {
      // Using dynamic import to reduce initial bundle size
      const { default: axios } = await import('axios');
      
      this.apiInstance = axios.create({
        baseURL: this.config.baseURL,
        timeout: this.config.timeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
          ...(this.config.headers || {})
        }
      });
      
      // Add request interceptor for logging and analytics
      this.apiInstance.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
          // Add request ID for tracking
          const requestId = this.generateRequestId();
          if (!config.headers) {
            config.headers = new AxiosHeaders();
          }
          config.headers['X-Request-ID'] = requestId;
          
          // Add timestamp for measuring response time
          const configWithMeta = config as RequestConfigWithMetadata;
          configWithMeta.metadata = { startTime: Date.now() };
          
          return configWithMeta;
        },
        (error: unknown) => {
          return Promise.reject(this.normalizeError(error));
        }
      );
      
      // Add response interceptor for error handling
      this.apiInstance.interceptors.response.use(
        (response: AxiosResponse) => {
          // Add processing time to response
          const configWithMeta = response.config as RequestConfigWithMetadata;
          if (configWithMeta.metadata?.startTime) {
            const processingTime = Date.now() - configWithMeta.metadata.startTime;
            response.headers['X-Processing-Time'] = processingTime.toString();
          }
          
          return response;
        },
        (error: unknown) => {
          return Promise.reject(this.normalizeError(error));
        }
      );
    } catch (error) {
      console.error('Failed to initialize AI service client:', error);
      throw new AIServiceError(
        'AI service initialization failed', 
        AIErrorType.UNKNOWN
      );
    }
  }
  
  /**
   * Make a request to the AI service with automatic retries
   */
  protected async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST',
    data?: any,
    config?: Partial<AxiosRequestConfig>
  ): Promise<T> {
    await this.ensureInitialized();
    
    const retryCount = this.config.retryCount || 0;
    let lastError: AIServiceError | null = null;
    
    // Try the request with retries
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        // Add retry attempt to request headers
        const requestConfig: AxiosRequestConfig = {
          ...(config || {}),
          method,
          url: endpoint,
          headers: {
            ...(config?.headers || {}),
            ...(attempt > 0 ? { 'X-Retry-Attempt': attempt.toString() } : {})
          },
          data: method !== 'GET' ? data : undefined,
          params: method === 'GET' ? data : undefined
        };
        
        const response = await this.apiInstance!(requestConfig);
        return response.data as T;
      } catch (error) {
        lastError = this.normalizeError(error);
        
        // Don't retry on certain error types
        if (
          lastError.type === AIErrorType.AUTHENTICATION || 
          lastError.type === AIErrorType.PERMISSION || 
          lastError.type === AIErrorType.VALIDATION
        ) {
          break;
        }
        
        // If this is not the last attempt, wait before retrying
        if (attempt < retryCount) {
          const delayMs = this.getRetryDelay(attempt);
          await this.delay(delayMs);
          console.warn(`Retrying AI request to ${endpoint} (attempt ${attempt + 1}/${retryCount})`);
        }
      }
    }
    
    // If we get here, all attempts failed
    if (lastError) {
      throw lastError;
    } else {
      throw new AIServiceError(
        `Request to ${endpoint} failed after ${retryCount + 1} attempts`,
        AIErrorType.UNKNOWN
      );
    }
  }

  /**
   * Ensure the API client is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.apiInstance) {
      await this.initializeClient();
    }
    
    if (!this.apiInstance) {
      throw new AIServiceError(
        'AI service client not initialized',
        AIErrorType.UNKNOWN
      );
    }
  }
  
  /**
   * Convert various error types to a standardized AIServiceError
   */
  private normalizeError(error: unknown): AIServiceError {
    // Already normalized
    if (error instanceof AIServiceError) {
      return error;
    }
    
    // Axios error
    if (typeof error === 'object' && error !== null && 'isAxiosError' in error && error.isAxiosError) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        // Server responded with error status
        const statusCode = axiosError.response.status;
        const responseData = axiosError.response.data as any;
        const requestId = axiosError.response.headers ? 
          (axiosError.response.headers['x-request-id'] as string) : undefined;
        
        let errorType: AIErrorType;
        let errorMessage: string;
        let errorDetails: any;
        
        // Try to extract error details from response
        if (responseData && typeof responseData === 'object') {
          errorMessage = responseData.message || responseData.error || axiosError.message;
          errorDetails = responseData.details || responseData;
        } else {
          errorMessage = axiosError.message;
          errorDetails = responseData;
        }
        
        // Determine error type from status code
        switch (statusCode) {
          case 401:
            errorType = AIErrorType.AUTHENTICATION;
            break;
          case 403:
            errorType = AIErrorType.PERMISSION;
            break;
          case 429:
            errorType = AIErrorType.RATE_LIMIT;
            break;
          case 400:
          case 422:
            errorType = AIErrorType.VALIDATION;
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            errorType = AIErrorType.SERVER;
            break;
          default:
            errorType = AIErrorType.UNKNOWN;
        }
        
        return new AIServiceError(
          errorMessage,
          errorType,
          statusCode,
          errorDetails,
          requestId
        );
      } else if (axiosError.request) {
        // Request was made but no response received
        return new AIServiceError(
          'No response received from AI service',
          AIErrorType.NETWORK
        );
      }
    }
    
    // Generic error
    const genericError = error as Error;
    return new AIServiceError(
      genericError.message || 'Unknown AI service error',
      AIErrorType.UNKNOWN,
      undefined,
      error
    );
  }
  
  /**
   * Check if the service is available
   */
  public async checkHealth(): Promise<boolean> {
    try {
      await this.ensureInitialized();
      const result = await this.makeRequest<{ status: string }>('/health');
      return result.status === 'ok';
    } catch (error) {
      return false;
    }
  }

  /**
   * Utility: Generate a unique request ID
   */
  private generateRequestId(): string {
    return 'ai-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Utility: Calculate delay for retry attempts using exponential backoff
   */
  private getRetryDelay(attempt: number): number {
    const baseDelay = 500; // 500ms base
    return Math.min(
      baseDelay * Math.pow(2, attempt), // Exponential backoff
      10000 // Max 10 seconds
    ) + Math.random() * 500; // Add jitter
  }

  /**
   * Utility: Promise-based delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Gets the current configuration
   */
  protected getConfig(): AIServiceConfig {
    return { ...this.config };
  }

  /**
   * Updates the configuration for the service
   * Will reinitialize the client on next request
   */
  public updateConfig(config: Partial<AIServiceConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
    this.apiInstance = null; // Force reinitialization
  }
}

export default AIService;