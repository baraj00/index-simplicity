import { HttpClient } from '../utils/http';
import { RawTokenInfo, RawOp, TokenInfo, Operation } from '../types/brc20.types';
import { RawAddressBalance, AddressBalance } from '../types/address.types';
import { ActivityOptions } from '../types/common.types';
import { normalizeTokenInfo, normalizeOp, normalizeBalance } from '../utils/normalize';

/**
 * Service gérant les endpoints BRC-20 liés aux tokens.
 *
 * Endpoints couverts :
 *   GET /v1/indexer/brc20/list              → listTokens()
 *   GET /v1/indexer/brc20/{ticker}/info     → getToken()
 *   GET /v1/indexer/brc20/{ticker}/holders  → getHolders()
 *   GET /v1/indexer/brc20/{ticker}/history  → getHistory()
 */
export class TokenService {
  constructor(private readonly http: HttpClient) {}

  /**
   * Liste tous les tokens BRC-20 déployés sur le protocole.
   *
   * @returns Tableau de TokenInfo trié par ordre de déploiement.
   */
  async listTokens(): Promise<TokenInfo[]> {
    const raw = await this.http.get<RawTokenInfo[]>('/v1/indexer/brc20/list');
    return raw.map(normalizeTokenInfo);
  }

  /**
   * Récupère les informations détaillées d'un token.
   *
   * @param ticker - Ticker du token (ex: "ORDI", "W") — insensible à la casse
   *
   * @throws NotFoundError si le ticker n'est pas déployé sur le protocole
   *
   * @example
   * const token = await client.getToken('ORDI');
   * console.log(token.holders);       // 12500
   * console.log(token.currentSupply); // "18000000"
   */
  async getToken(ticker: string): Promise<TokenInfo> {
    const raw = await this.http.get<RawTokenInfo>(
      `/v1/indexer/brc20/${encodeURIComponent(ticker.toUpperCase())}/info`,
    );
    return normalizeTokenInfo(raw);
  }

  /**
   * Retourne la liste de tous les détenteurs d'un token avec leurs balances.
   *
   * @param ticker - Ticker du token
   *
   * @example
   * const holders = await client.getTokenHolders('ORDI');
   * // Triés par balance décroissante
   */
  async getHolders(ticker: string): Promise<AddressBalance[]> {
    const raw = await this.http.get<RawAddressBalance[]>(
      `/v1/indexer/brc20/${encodeURIComponent(ticker.toUpperCase())}/holders`,
    );
    return raw.map(normalizeBalance);
  }

  /**
   * Retourne l'historique des opérations (deploy, mint, transfer) pour un token.
   *
   * @param ticker  - Ticker du token
   * @param options - Pagination : limit (défaut 100), skip (défaut 0)
   *
   * @example
   * const mints = await client.getTokenHistory('ORDI', { opType: 'mint', limit: 50 });
   */
  async getHistory(ticker: string, options: ActivityOptions = {}): Promise<Operation[]> {
    const raw = await this.http.get<RawOp[]>(
      `/v1/indexer/brc20/${encodeURIComponent(ticker.toUpperCase())}/history`,
      {
        limit: options.limit,
        skip: options.skip,
      },
    );
    return raw.map(normalizeOp);
  }
}
