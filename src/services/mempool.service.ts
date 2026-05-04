import { HttpClient } from '../utils/http';
import {
  RawPendingResult,
  PendingResult,
} from '../types/mempool.types';
import { normalizePendingResult } from '../utils/normalize';

/**
 * Service gérant les endpoints de la mempool Bitcoin.
 *
 * Endpoints couverts :
 *   POST /v1/mempool/check-pending   → checkPending()
 */
export class MempoolService {
  constructor(private readonly http: HttpClient) {}

  /**
   * Vérifie si une adresse a des transferts BRC-20 non confirmés pour un ticker.
   *
   * @param address - Adresse Bitcoin
   * @param ticker  - Ticker du token BRC-20
   *
   * @example
   * const result = await client.checkPending('bc1p...', 'ORDI');
   * if (result.hasPendingTransfer) {
   *   console.log('Transfert en attente d\'ORDI détecté !');
   * }
   */
  async checkPending(address: string, ticker: string): Promise<PendingResult> {
    const raw = await this.http.post<RawPendingResult>('/v1/mempool/check-pending', {
      address,
      ticker: ticker.toUpperCase(),
    });
    return normalizePendingResult(raw);
  }
}
