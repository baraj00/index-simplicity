/**
 * Classes d'erreurs du SDK Universal Protocol.
 *
 * Hiérarchie :
 *   Error
 *   └── UniversalSDKError    (base de tous les erreurs SDK)
 *       ├── ApiError         (erreur HTTP de l'indexeur)
 *       │   └── NotFoundError (404)
 *       └── ConfigError      (mauvaise configuration du client)
 */

/** Classe de base pour toutes les erreurs du SDK. */
export class UniversalSDKError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UniversalSDKError';
    // Nécessaire pour que instanceof fonctionne correctement avec TypeScript
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Levée quand l'API Simplicity retourne une réponse HTTP d'erreur (4xx, 5xx).
 */
export class ApiError extends UniversalSDKError {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(`[HTTP ${statusCode}] ${message}`);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Levée quand une ressource demandée n'existe pas (404).
 * Ex : adresse inconnue, ticker inexistant.
 */
export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(404, `Ressource introuvable : ${resource}`);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Levée quand le client est mal configuré.
 * Ex : baseUrl manquante ou invalide.
 */
export class ConfigError extends UniversalSDKError {
  constructor(message: string) {
    super(`[Configuration] ${message}`);
    this.name = 'ConfigError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
