import { HttpClient } from '../utils/http';
import {
  RawPendingResult,
  PendingResult,
} from '../types/mempool.types';
import { normalizePendingResult } from '../utils/normalize';

/**
 * Service gérant les endpoints de la mempool Bitcoin.
 *
 * Permet de vérifier si des transferts BRC-20 sont en attente de confirmation
 * pour une adresse donnée.
 *
 * Endpoints couverts :
 *   POST /v1/mempool/check-pending   → checkPending()
 */
export class MempoolService {
  constructor(private readonly http: HttpClient) {}

  /**
   * Vérifie les transferts BRC-20 non confirmés pour une adresse et un ticker.
   *
   * Utile pour afficher un solde "en attente" dans une interface utilisateur,
   * avant que la transaction soit confirmée sur le réseau Bitcoin.
   *
   * @param address - Adresse Bitcoin (bc1p..., bc1q...)
   * @param ticker  - Ticker du token BRC-20 (ex: "ORDI", "W")
   *
   * @example
   * const pending = await client.checkPending('bc1p...', 'ORDI');
   * if (pending.transfers.length > 0) {
   *   console.log(`En attente: ${pending.pendingAmount} ORDI`);
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
