import { HttpClient } from '../utils/http';
import {
  RawPool,
  RawSwapPosition,
  RawTvlInfo,
  Pool,
  SwapPosition,
  TvlInfo,
  ListPositionsOptions,
  ListPoolsOptions,
} from '../types/swap.types';
import { RawListResponse } from '../types/common.types';
import {
  normalizePool,
  normalizeSwapPosition,
  normalizeTvlInfo,
} from '../utils/normalize';

/**
 * Service gérant les endpoints du module Swap de Simplicity.
 *
 * Le swap Universal Protocol est un système de positions verrouillées
 * (intent-based) : l'utilisateur verrouille des tokens avec swap.init,
 * un contrepartiste exécute avec swap.exe. Il n'y a PAS d'AMM ni de réserves.
 *
 * Endpoints couverts :
 *   GET /v1/indexer/swap/pools                        → listPools()
 *   GET /v1/indexer/swap/tvl/{ticker}                 → getTvl()
 *   GET /v1/indexer/swap/positions                    → listPositions()
 *   GET /v1/indexer/swap/positions/{id}               → getPosition()
 *   GET /v1/indexer/swap/expiring                     → getExpiringPositions()
 *   GET /v1/indexer/swap/owner/{owner}/positions      → getOwnerPositions()
 */
export class SwapService {
  constructor(private readonly http: HttpClient) {}

  /**
   * Liste tous les pools de swap disponibles.
   *
   * @param options - Filtrer par src et/ou dst ticker
   *
   * @example
   * const pools = await client.listPools({ src: 'LOL' });
   */
  async listPools(options: ListPoolsOptions = {}): Promise<Pool[]> {
    // L'API peut retourner un tableau direct ou un wrapper paginé
    const raw = await this.http.get<RawPool[] | RawListResponse<RawPool>>(
      '/v1/indexer/swap/pools',
      { src: options.src, dst: options.dst },
    );
    const items = Array.isArray(raw) ? raw : raw.items;
    return items.map(normalizePool);
  }

  /**
   * Retourne la TVL (Total Value Locked) d'un token dans le module Swap.
   *
   * @param ticker - Ticker du token
   *
   * @example
   * const tvl = await client.getSwapTvl('LOL');
   * console.log(tvl.tvlEstimate); // "1111111.11000000"
   */
  async getTvl(ticker: string): Promise<TvlInfo> {
    const raw = await this.http.get<RawTvlInfo>(
      `/v1/indexer/swap/tvl/${encodeURIComponent(ticker.toUpperCase())}`,
    );
    return normalizeTvlInfo(raw);
  }

  /**
   * Liste les positions de swap avec filtres optionnels.
   *
   * @param options - Filtres : owner, src, dst, status, limit, offset
   *
   * @example
   * // Toutes les positions actives du pool LOL-WTF
   * const positions = await client.listSwapPositions({
   *   src: 'LOL', dst: 'WTF', status: 'active'
   * });
   */
  async listPositions(options: ListPositionsOptions = {}): Promise<SwapPosition[]> {
    const raw = await this.http.get<RawListResponse<RawSwapPosition>>(
      '/v1/indexer/swap/positions',
      {
        owner: options.owner,
        src: options.src,
        dst: options.dst,
        status: options.status,
        limit: options.limit,
        offset: options.offset,
      },
    );
    return raw.items.map(normalizeSwapPosition);
  }

  /**
   * Récupère une position de swap par son identifiant unique.
   *
   * @param id - Identifiant numérique de la position
   *
   * @throws NotFoundError si la position n'existe pas
   *
   * @example
   * const position = await client.getSwapPosition(42);
   * console.log(position.status); // 'active' | 'completed' | 'expired'
   */
  async getPosition(id: number): Promise<SwapPosition> {
    const raw = await this.http.get<RawSwapPosition>(
      `/v1/indexer/swap/positions/${encodeURIComponent(String(id))}`,
    );
    return normalizeSwapPosition(raw);
  }

  /**
   * Retourne les positions de swap qui expirent à une hauteur de bloc donnée ou avant.
   *
   * @param heightLte - Hauteur de bloc maximale pour l'expiration (REQUIS)
   * @param options   - Pagination : limit, offset
   *
   * @example
   * // Positions qui expirent au prochain bloc ou avant
   * const expiring = await client.getExpiringSwapPositions(895000, { limit: 20 });
   * expiring.forEach(p => console.log(`Expire bloc #${p.unlockHeight}`));
   */
  async getExpiringPositions(
    heightLte: number,
    options: Pick<ListPositionsOptions, 'limit' | 'offset'> = {},
  ): Promise<SwapPosition[]> {
    const raw = await this.http.get<RawListResponse<RawSwapPosition>>(
      '/v1/indexer/swap/expiring',
      { height_lte: heightLte, limit: options.limit, offset: options.offset },
    );
    return raw.items.map(normalizeSwapPosition);
  }

  /**
   * Liste toutes les positions de swap d'une adresse.
   *
   * @param owner   - Adresse Bitcoin du propriétaire
   * @param options - Filtres : status, limit, offset
   *
   * @example
   * const myPositions = await client.getOwnerSwapPositions('bc1p...');
   * const active = myPositions.filter(p => p.status === 'active');
   */
  async getOwnerPositions(
    owner: string,
    options: Omit<ListPositionsOptions, 'owner'> = {},
  ): Promise<SwapPosition[]> {
    const raw = await this.http.get<RawListResponse<RawSwapPosition>>(
      `/v1/indexer/swap/owner/${encodeURIComponent(owner)}/positions`,
      {
        status: options.status,
        limit: options.limit,
        offset: options.offset,
      },
    );
    return raw.items.map(normalizeSwapPosition);
  }
}
