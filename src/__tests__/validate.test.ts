import { describe, it, expect } from 'vitest';
import {
  assertTicker,
  assertAddress,
  assertPositiveInt,
  assertNonEmptyString,
} from '../utils/validate';
import { ConfigError } from '../utils/errors';

describe('assertTicker', () => {
  it('accepts a valid ticker', () => {
    expect(() => assertTicker('ORDI')).not.toThrow();
    expect(() => assertTicker('W')).not.toThrow();
  });

  it('throws on empty string', () => {
    expect(() => assertTicker('')).toThrow(ConfigError);
    expect(() => assertTicker('  ')).toThrow(ConfigError);
  });

  it('throws on non-string', () => {
    expect(() => assertTicker(null)).toThrow(ConfigError);
    expect(() => assertTicker(undefined)).toThrow(ConfigError);
    expect(() => assertTicker(42)).toThrow(ConfigError);
  });

  it('includes param name in error message', () => {
    expect(() => assertTicker('', 'myParam')).toThrow("'myParam'");
  });
});

describe('assertAddress', () => {
  it('accepts a bc1q address', () => {
    expect(() => assertAddress('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq')).not.toThrow();
  });

  it('accepts a bc1p (Taproot) address', () => {
    expect(() =>
      assertAddress('bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297'),
    ).not.toThrow();
  });

  it('accepts a tb1 (testnet) address', () => {
    expect(() => assertAddress('tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx')).not.toThrow();
  });

  it('accepts a legacy address (1...)', () => {
    expect(() => assertAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf0')).not.toThrow();
  });

  it('throws on empty string', () => {
    expect(() => assertAddress('')).toThrow(ConfigError);
    expect(() => assertAddress('  ')).toThrow(ConfigError);
  });

  it('throws on non-string', () => {
    expect(() => assertAddress(null)).toThrow(ConfigError);
    expect(() => assertAddress(undefined)).toThrow(ConfigError);
  });
});

describe('assertPositiveInt', () => {
  it('accepts 0', () => {
    expect(() => assertPositiveInt(0, 'height')).not.toThrow();
  });

  it('accepts positive integers', () => {
    expect(() => assertPositiveInt(1, 'height')).not.toThrow();
    expect(() => assertPositiveInt(832000, 'height')).not.toThrow();
  });

  it('throws on negative numbers', () => {
    expect(() => assertPositiveInt(-1, 'height')).toThrow(ConfigError);
  });

  it('throws on floats', () => {
    expect(() => assertPositiveInt(1.5, 'height')).toThrow(ConfigError);
  });

  it('throws on non-number', () => {
    expect(() => assertPositiveInt('5', 'height')).toThrow(ConfigError);
    expect(() => assertPositiveInt(null, 'height')).toThrow(ConfigError);
  });
});

describe('assertNonEmptyString', () => {
  it('accepts a non-empty string', () => {
    expect(() => assertNonEmptyString('abc123', 'txid')).not.toThrow();
  });

  it('throws on empty string', () => {
    expect(() => assertNonEmptyString('', 'txid')).toThrow(ConfigError);
  });

  it('throws on whitespace-only string', () => {
    expect(() => assertNonEmptyString('   ', 'txid')).toThrow(ConfigError);
  });

  it('throws on non-string', () => {
    expect(() => assertNonEmptyString(null, 'txid')).toThrow(ConfigError);
  });
});
