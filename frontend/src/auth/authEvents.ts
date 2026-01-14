/**
 * Auth Event System
 *
 * Provides a decoupled way for the API client to communicate auth state changes
 * to the AuthContext without creating circular dependencies.
 *
 * Also stores the current access token for API client to use in Authorization header.
 *
 * Industry standard pattern: Event-driven architecture for cross-cutting concerns.
 */

type AuthEventType = 'session-expired' | 'unauthorized';

type AuthEventListener = (event: AuthEventType) => void;

class AuthEventEmitter {
  private listeners: Set<AuthEventListener> = new Set();
  private _accessToken: string | null = null;

  subscribe(listener: AuthEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(event: AuthEventType): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Auth event listener error:', error);
      }
    });
  }

  // Token storage for API client to use
  setAccessToken(token: string | null): void {
    this._accessToken = token;
  }

  getAccessToken(): string | null {
    return this._accessToken;
  }
}

// Singleton instance
export const authEvents = new AuthEventEmitter();
