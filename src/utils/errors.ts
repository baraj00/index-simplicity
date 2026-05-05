/**
 * Error classes for the Universal Protocol SDK.
 *
 * Hierarchy:
 *   Error
 *   └── UniversalSDKError    (base for all SDK errors)
 *       ├── ApiError         (HTTP error from the indexer)
 *       │   └── NotFoundError (404)
 *       └── ConfigError      (bad client configuration)
 */

/** Base class for all SDK errors. */
export class UniversalSDKError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UniversalSDKError';
    // Required for instanceof to work correctly with TypeScript
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when the Simplicity API returns an HTTP error response (4xx, 5xx).
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
 * Thrown when a requested resource does not exist (404).
 * e.g. unknown address, undeployed ticker.
 */
export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(404, `Resource not found: ${resource}`);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when the client is misconfigured.
 * e.g. missing or invalid baseUrl.
 */
export class ConfigError extends UniversalSDKError {
  constructor(message: string) {
    super(`[Config] ${message}`);
    this.name = 'ConfigError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
