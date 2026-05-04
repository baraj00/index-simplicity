import { HttpClient } from '../utils/http';
import {
  RawPool,
  RawSwapQuote,
  RawSwapPosition,
  RawTvlInfo,
  Pool,
  SwapQuote,
  SwapPosition,
  TvlInfo,
  ListPositionsOptions,
  ListPoolsOptions,
} from '../types/swap.types';
import { RawListResponse } from '../types/common.types';
import {
  normalizePool,
  normalizeSwapQuote,
  normalizeSwapPosition,
  normalizeTvlInfo,
} from '../utils/normalize';

/**
 * Service gérant les endpoints du module Swap de Simplicity.
 *
 * Le swap est un AMM (Automated Market Maker) natif Bitcoin basé sur le
 * constant product (x * y = k), sans smart contracts ni layer 2.
 *
 * Endpoints couverts :
 *   GET /v1/indexer/swap/pools                        → listPools()
 *   GET /v1/indexer/swap/pools/{pool_id}/reserves     → getPoolReserves()
 *   GET /v1/indexer/swap/quote                        → getQuote()
 *   GET /v1/indexer/swap/tvl/{ticker}                 → getTvl()
 *   GET /v1/indexer/swap/positions                    → listPositions()
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
   * Récupère les réserves actuelles d'un pool spécifique.
   *
   * @param poolId - ID canonique du pool, trié alphabétiquement (ex: "LOL-WTF", pas "WTF-LOL")
   *
   * @throws NotFoundError si le pool n'existe pas
   *
   * @example
   * const pool = await client.getPoolReserves('LOL-WTF');
   * console.log(pool.reserveA); // réserve du token A
   */
  async getPoolReserves(poolId: string): Promise<Pool> {
    const raw = await this.http.get<RawPool>(
      `/v1/indexer/swap/pools/${encodeURIComponent(poolId)}/reserves`,
    );
    return normalizePool(raw);
  }

  /**
   * Simule un swap et retourne le montant attendu en sortie.
   *
   * N'exécute RIEN on-chain — utile pour afficher une preview avant
   * de construire la transaction OP_RETURN.
   *
   * @param src    - Ticker du token à échanger (ex: "LOL")
   * @param dst    - Ticker du token à recevoir (ex: "WTF")
   * @param amount - Montant à échanger (en unités décimales, ex: "100.0")
   *
   * @throws NotFoundError si le pool n'existe pas (aucune position active)
   *
   * @example
   * const quote = await client.getSwapQuote('LOL', 'WTF', '100.0');
   * console.log(`Vous recevrez ~${quote.amountOut} WTF`);
   * console.log(`Impact prix : ${quote.priceImpactPercent}%`);
   */
  async getQuote(src: string, dst: string, amount: string): Promise<SwapQuote> {
    const raw = await this.http.get<RawSwapQuote>('/v1/indexer/swap/quote', {
      src: src.toUpperCase(),
      dst: dst.toUpperCase(),
      amount,
    });
    return normalizeSwapQuote(raw);
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
