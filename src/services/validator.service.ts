import { HttpClient } from '../utils/http';
import {
  ValidateWrapMintRequest,
  ValidateAddressFromWitnessRequest,
  RawValidationResult,
  ValidationResult,
} from '../types/validator.types';
import { normalizeValidationResult } from '../utils/normalize';

/**
 * Service gérant les endpoints de validation de l'indexeur Simplicity.
 *
 * Permet de valider les transactions Wrap (W) et les adresses Taproot
 * avant de les soumettre au réseau Bitcoin.
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
   * Vérifie que la transaction Bitcoin est correctement formée pour
   * minter des tokens W selon le protocole Universal Protocol.
   *
   * @param txid - TXID de la transaction Bitcoin à valider
   *
   * @example
   * const result = await client.validateWrapMint('a1b2c3...');
   * if (!result.valid) {
   *   console.error('Transaction invalide:', result.message);
   * }
   */
  async validateWrapMint(txid: string): Promise<ValidationResult> {
    const body: ValidateWrapMintRequest = { txid };
    const raw = await this.http.post<RawValidationResult>(
      '/v1/validator/validate-wrap-mint',
      body,
    );
    return normalizeValidationResult(raw);
  }

  /**
   * Valide et dérive une adresse Bitcoin depuis un script witness Taproot.
   *
   * Utile pour vérifier qu'une adresse générée côté client correspond
   * bien au witness script attendu par le protocole.
   *
   * @param witness - Script witness Taproot (hex ou base64)
   *
   * @example
   * const result = await client.validateAddressFromWitness('5120...');
   * if (result.valid) {
   *   console.log('Adresse dérivée:', result.address);
   * }
   */
  async validateAddressFromWitness(witness: string): Promise<ValidationResult> {
    const body: ValidateAddressFromWitnessRequest = { witness };
    const raw = await this.http.post<RawValidationResult>(
      '/v1/validator/validate-address-from-witness',
      body,
    );
    return normalizeValidationResult(raw);
  }
}
