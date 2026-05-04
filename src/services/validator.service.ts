import { HttpClient } from '../utils/http';
import {
  ValidateWrapMintRequest,
  ValidateAddressFromWitnessRequest,
  RawValidateWrapMintResponse,
  RawValidateAddressResponse,
  WrapMintValidationResult,
  AddressValidationResult,
} from '../types/validator.types';
import { normalizeWrapMintValidation, normalizeAddressValidation } from '../utils/normalize';

/**
 * Service gérant les endpoints de validation de l'indexeur Simplicity.
 *
 * Endpoints couverts :
 *   POST /v1/validator/validate-wrap-mint              → validateWrapMint()
 *   POST /v1/validator/validate-address-from-witness   → validateAddressFromWitness()
 */
export class ValidatorService {
  constructor(private readonly http: HttpClient) {}

  /**
   * Valide une transaction de Wrap Mint (création de token W).
   *
   * @param rawTxHex - Transaction Bitcoin brute en hexadécimal
   *
   * @example
   * const result = await client.validateWrapMint('0200000000010001a83c...');
   * if (!result.isValid) console.error('Invalide:', result.reason);
   */
  async validateWrapMint(rawTxHex: string): Promise<WrapMintValidationResult> {
    const body: ValidateWrapMintRequest = { raw_tx_hex: rawTxHex };
    const raw = await this.http.post<RawValidateWrapMintResponse>(
      '/v1/validator/validate-wrap-mint',
      body,
    );
    return normalizeWrapMintValidation(raw);
  }

  /**
   * Valide et recalcule une adresse Taproot à partir d'une transaction brute.
   *
   * @param rawTxHex - Transaction Bitcoin brute en hexadécimal
   *
   * @example
   * const result = await client.validateAddressFromWitness('0200000000010001a83c...');
   * if (result.isValid) console.log('Adresse:', result.foundAddress);
   */
  async validateAddressFromWitness(rawTxHex: string): Promise<AddressValidationResult> {
    const body: ValidateAddressFromWitnessRequest = { raw_tx_hex: rawTxHex };
    const raw = await this.http.post<RawValidateAddressResponse>(
      '/v1/validator/validate-address-from-witness',
      body,
    );
    return normalizeAddressValidation(raw);
  }
}
