/**
 * Auth Event System
 *
 * Provides a decoupled way for the API client to communicate auth state changes
 * to the AuthContext without creating circular dependencies.
 *
 * Industry standard pattern: Event-driven architecture for cross-cutting concerns.
 */

type AuthEventType = 'session-expired' | 'unauthorized';

type AuthEventListener = (event: AuthEventType) => void;

class AuthEventEmitter {
  private listeners: Set<AuthEventListener> = new Set();

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
}

// Singleton instance
export const authEvents = new AuthEventEmitter();
