import { HttpClient } from '../utils/http';
import { RawTokenInfo, RawOp, TokenInfo, Operation } from '../types/brc20.types';
import { RawAddressBalance, AddressBalance } from '../types/address.types';
import { ActivityOptions } from '../types/common.types';
import { normalizeTokenInfo, normalizeOp, normalizeBalance } from '../utils/normalize';

/**
 * Service gérant les endpoints BRC-20 liés aux tokens.
 *
 * Endpoints couverts :
 *   GET /v1/indexer/brc20/list                          → listTokens()
 *   GET /v1/indexer/brc20/list/all                      → listAllTokens()
 *   GET /v1/indexer/brc20/{ticker}/info                 → getToken()
 *   GET /v1/indexer/brc20/{ticker}/holders              → getHolders()
 *   GET /v1/indexer/brc20/{ticker}/holders/all          → getAllHolders()
 *   GET /v1/indexer/brc20/{ticker}/history              → getHistory()
 *   GET /v1/indexer/brc20/{ticker}/history/all          → getAllHistory()
 *   GET /v1/indexer/brc20/{ticker}/tx/{txid}/history    → getHistoryByTx()
 *   GET /v1/indexer/brc20/history-by-height/{height}    → getHistoryByHeight()
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

  /**
   * Retourne TOUS les tokens BRC-20 déployés (sans pagination).
   *
   * À utiliser avec précaution si le nombre de tokens est très grand.
   *
   * @example
   * const all = await client.listAllTokens();
   */
  async listAllTokens(): Promise<TokenInfo[]> {
    const raw = await this.http.get<RawTokenInfo[]>('/v1/indexer/brc20/list/all');
    return raw.map(normalizeTokenInfo);
  }

  /**
   * Retourne TOUS les détenteurs d'un token (sans pagination).
   *
   * @param ticker - Ticker du token
   *
   * @example
   * const allHolders = await client.getAllTokenHolders('ORDI');
   */
  async getAllHolders(ticker: string): Promise<AddressBalance[]> {
    const raw = await this.http.get<RawAddressBalance[]>(
      `/v1/indexer/brc20/${encodeURIComponent(ticker.toUpperCase())}/holders/all`,
    );
    return raw.map(normalizeBalance);
  }

  /**
   * Retourne TOUT l'historique des opérations pour un token (sans pagination).
   *
   * @param ticker - Ticker du token
   *
   * @example
   * const fullHistory = await client.getAllTokenHistory('ORDI');
   */
  async getAllHistory(ticker: string): Promise<Operation[]> {
    const raw = await this.http.get<RawOp[]>(
      `/v1/indexer/brc20/${encodeURIComponent(ticker.toUpperCase())}/history/all`,
    );
    return raw.map(normalizeOp);
  }

  /**
   * Retourne toutes les opérations BRC-20 liées à une transaction Bitcoin spécifique.
   *
   * @param ticker - Ticker du token
   * @param txid   - TXID de la transaction Bitcoin
   *
   * @example
   * const ops = await client.getTokenHistoryByTx('ORDI', 'a1b2c3...');
   */
  async getHistoryByTx(ticker: string, txid: string): Promise<Operation[]> {
    const raw = await this.http.get<RawOp[]>(
      `/v1/indexer/brc20/${encodeURIComponent(ticker.toUpperCase())}/tx/${encodeURIComponent(txid)}/history`,
    );
    return raw.map(normalizeOp);
  }

  /**
   * Retourne toutes les opérations BRC-20 indexées à une hauteur de bloc donnée.
   *
   * Utile pour reconstruire l'état du protocole à un bloc précis.
   *
   * @param height - Hauteur du bloc Bitcoin (ex: 840000)
   *
   * @example
   * const ops = await client.getHistoryByHeight(840000);
   */
  async getHistoryByHeight(height: number): Promise<Operation[]> {
    const raw = await this.http.get<RawOp[]>(
      `/v1/indexer/brc20/history-by-height/${encodeURIComponent(String(height))}`,
    );
    return raw.map(normalizeOp);
  }
}
