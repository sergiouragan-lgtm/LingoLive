import { auth } from '@/firebase';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  statusCode: number;
}

export interface ApiClientOptions {
  timeout?: number;
  retries?: number;
}

class ApiClient {
  private baseUrl = '/api';
  private timeout: number = 30000;
  private retries: number = 3;

  constructor(options?: ApiClientOptions) {
    if (options?.timeout) this.timeout = options.timeout;
    if (options?.retries) this.retries = options.retries;
  }

  private async getAuthToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    return user.getIdToken();
  }

  async request<T = any>(
    method: string,
    endpoint: string,
    body?: any,
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      const url = `${this.baseUrl}${endpoint}`;

      const response = await Promise.race([
        fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: body ? JSON.stringify(body) : undefined,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), this.timeout)
        ),
      ]);

      let data;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      return {
        data,
        statusCode: response.status,
      };
    } catch (error) {
      if (retryCount < this.retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.request<T>(method, endpoint, body, retryCount + 1);
      }

      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 0,
      };
    }
  }

  get<T = any>(endpoint: string) {
    return this.request<T>('GET', endpoint);
  }

  post<T = any>(endpoint: string, body?: any) {
    return this.request<T>('POST', endpoint, body);
  }

  put<T = any>(endpoint: string, body?: any) {
    return this.request<T>('PUT', endpoint, body);
  }

  delete<T = any>(endpoint: string, body?: any) {
    return this.request<T>('DELETE', endpoint, body);
  }
}

export const apiClient = new ApiClient();
