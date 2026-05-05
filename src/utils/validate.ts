import { ConfigError } from './errors';

/**
 * Input validation helpers used by SDK services.
 * Throws ConfigError on invalid inputs so developers get clear, early feedback.
 */

export function assertTicker(ticker: unknown, paramName = 'ticker'): void {
  if (!ticker || typeof ticker !== 'string' || ticker.trim().length === 0) {
    throw new ConfigError(`'${paramName}' must be a non-empty string`);
  }
}

export function assertAddress(address: unknown, paramName = 'address'): void {
  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    throw new ConfigError(`'${paramName}' must be a non-empty string`);
  }
}

export function assertPositiveInt(value: unknown, paramName: string): void {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new ConfigError(`'${paramName}' must be a non-negative integer, got: ${value}`);
  }
}

export function assertNonEmptyString(value: unknown, paramName: string): void {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    throw new ConfigError(`'${paramName}' must be a non-empty string`);
  }
}
