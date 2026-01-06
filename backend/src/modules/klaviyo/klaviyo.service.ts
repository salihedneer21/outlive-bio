import { env } from '@config/env';
import type {
  KlaviyoErrorResponse,
  SendEventParams
} from './klaviyo.types';

// Use the global fetch available in Node 18+.
// We intentionally keep types loose here to avoid adding DOM libs.
declare const fetch: (input: string, init?: any) => Promise<any>;

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

class KlaviyoService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://a.klaviyo.com/api';
  private readonly apiVersion = '2023-10-15';

  constructor() {
    this.apiKey = env.KLAVIYO_API_KEY ?? '';
  }

  isEnabled(): boolean {
    return Boolean(this.apiKey);
  }

  async sendEvent(params: SendEventParams): Promise<ApiResponse> {
    if (!this.isEnabled()) {
      // Treat as no-op if Klaviyo is not configured
      return { success: true };
    }

    try {
      if (params.email) {
        await this.ensureProfileExists(params.patientId, params.email);
      }

      const payload = this.buildEventPayload(params);
      const response = await this.makeRequest('/events/', 'POST', payload);

      if (!response.ok) {
        let errorMessage = 'Unknown Klaviyo API error';

        try {
          const errorData = (await response.json()) as KlaviyoErrorResponse;
          if (errorData.errors && errorData.errors.length > 0) {
            const error = errorData.errors[0];
            const code = error.code ?? 'unknown';
            const title = error.title ?? 'Error';
            const detail = error.detail ?? 'Unknown error';
            errorMessage = `${title}: ${detail} (Code: ${code})`;
          }
        } catch {
          // Ignore JSON parse failures and fall back to generic error
        }

        return { success: false, error: errorMessage };
      }

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, error: errorMessage };
    }
  }

  private async ensureProfileExists(patientId: string, email: string): Promise<void> {
    try {
      const profilePayload = {
        data: {
          type: 'profile',
          attributes: {
            email,
            properties: {
              userId: patientId
            }
          }
        }
      };

      await this.makeRequest('/profiles/', 'POST', profilePayload);
    } catch {
      // Intentionally ignore profile creation failures; event sending will still be attempted
    }
  }

  private buildEventPayload(params: SendEventParams) {
    const {
      eventName,
      patientId,
      email,
      eventProperties = {},
      profileProperties = {}
    } = params;

    const finalEventProperties = {
      timestamp: new Date().toISOString(),
      ...eventProperties
    };

    const finalProfileProperties = {
      ...profileProperties
    };

    return {
      data: {
        type: 'event',
        attributes: {
          properties: finalEventProperties,
          time: new Date().toISOString(),
          value: 1,
          unique_id: `${patientId}_${eventName}_${Date.now()}`,
          metric: {
            data: {
              type: 'metric',
              attributes: { name: eventName }
            }
          },
          profile: {
            data: {
              type: 'profile',
              attributes: {
                ...(email && { email }),
                properties: {
                  userId: patientId,
                  ...finalProfileProperties
                }
              }
            }
          }
        }
      }
    };
  }

  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' = 'GET',
    body?: unknown
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;

    const requestOptions: any = {
      method,
      headers: {
        Authorization: `Klaviyo-API-Key ${this.apiKey}`,
        'Content-Type': 'application/json',
        revision: this.apiVersion
      }
    };

    if (body && (method === 'POST' || method === 'PATCH')) {
      requestOptions.body = JSON.stringify(body);
    }

    return fetch(url, requestOptions);
  }
}

export const klaviyoService = new KlaviyoService();

