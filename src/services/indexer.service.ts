import { HttpClient } from '../utils/http';
import { IndexerStatus, RawIndexerStatus } from '../types/brc20.types';
import { normalizeIndexerStatus } from '../utils/normalize';

/**
 * Service gérant les endpoints de santé et de statut de l'indexeur.
 *
 * Endpoints couverts :
 *   GET /v1/indexer/brc20/health  → health()
 *   GET /v1/indexer/brc20/status  → status()
 */
export class IndexerService {
  constructor(private readonly http: HttpClient) {}

  /**
   * Vérifie que l'indexeur est opérationnel.
   * @returns `{ status: "ok" }` si l'API répond correctement.
   */
  async health(): Promise<{ status: string }> {
    return this.http.get<{ status: string }>('/v1/indexer/brc20/health');
  }

  /**
   * Retourne la hauteur de bloc actuelle du réseau et l'état de sync.
   *
   * Permet de vérifier si l'indexeur est à jour par rapport à la chaîne.
   *
   * @example
   * const s = await client.status();
   * const lag = s.networkBlockHeight - s.lastBrc20OpBlock;
   * console.log(`Retard indexeur : ${lag} blocs`);
   */
  async status(): Promise<IndexerStatus> {
    const raw = await this.http.get<RawIndexerStatus>('/v1/indexer/brc20/status');
    return normalizeIndexerStatus(raw);
  }
}
