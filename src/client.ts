import { HttpClient } from './utils/http';
import { IndexerService } from './services/indexer.service';
import { TokenService } from './services/token.service';
import { AddressService } from './services/address.service';
import { SwapService } from './services/swap.service';
import { AddressBalance } from './types/address.types';
import { TokenInfo, Operation, IndexerStatus } from './types/brc20.types';
import {
  Pool,
  SwapQuote,
  SwapPosition,
  TvlInfo,
  ListPositionsOptions,
  ListPoolsOptions,
} from './types/swap.types';
import { ActivityOptions } from './types/common.types';

export interface UniversalClientOptions {
  /**
   * URL de base de l'indexeur Simplicity.
   * @default "http://localhost:8080"
   */
  baseUrl?: string;
  /**
   * Clé API optionnelle — envoyée dans le header X-API-Key.
   */
  apiKey?: string;
}

/**
 * Point d'entrée principal du SDK Universal Protocol.
 *
 * Instancier une seule fois et réutiliser l'instance (pattern singleton).
 *
 * @example
 * ```ts
 * // Développement local
 * const client = new UniversalClient();
 *
 * // Production
 * const client = new UniversalClient({
 *   baseUrl: 'https://indexer.myproject.com',
 *   apiKey: process.env.INDEXER_API_KEY,
 * });
 * ```
 */
export class UniversalClient {
  private readonly indexer: IndexerService;
  private readonly tokens: TokenService;
  private readonly address: AddressService;
  private readonly swap: SwapService;

  constructor(options: UniversalClientOptions = {}) {
    const http = new HttpClient({
      baseUrl: options.baseUrl ?? 'http://localhost:8080',
      apiKey: options.apiKey,
    });

    this.indexer = new IndexerService(http);
    this.tokens = new TokenService(http);
    this.address = new AddressService(http);
    this.swap = new SwapService(http);
  }

  // ---------------------------------------------------------------------------
  // Indexeur
  // ---------------------------------------------------------------------------

  /** Vérifie que l'indexeur est up. Retourne `{ status: "ok" }`. */
  health(): Promise<{ status: string }> {
    return this.indexer.health();
  }

  /**
   * Retourne l'état de synchronisation de l'indexeur.
   * Utile pour vérifier si l'indexeur est à jour avec le réseau Bitcoin.
   */
  status(): Promise<IndexerStatus> {
    return this.indexer.status();
  }

  // ---------------------------------------------------------------------------
  // Tokens BRC-20
  // ---------------------------------------------------------------------------

  /** Liste tous les tokens BRC-20 déployés sur le Universal Protocol. */
  listTokens(): Promise<TokenInfo[]> {
    return this.tokens.listTokens();
  }

  /**
   * Récupère les informations d'un token BRC-20 (supply, holders, deploy info...).
   * @param ticker - Ex: "ORDI", "W" (insensible à la casse)
   */
  getToken(ticker: string): Promise<TokenInfo> {
    return this.tokens.getToken(ticker);
  }

  /**
   * Retourne tous les détenteurs d'un token avec leurs balances.
   * @param ticker - Ex: "ORDI"
   */
  getTokenHolders(ticker: string): Promise<AddressBalance[]> {
    return this.tokens.getHolders(ticker);
  }

  /**
   * Retourne l'historique des opérations pour un token (deploy, mint, transfer).
   * @param ticker  - Ex: "ORDI"
   * @param options - Filtres : opType, limit, skip
   */
  getTokenHistory(ticker: string, options?: ActivityOptions): Promise<Operation[]> {
    return this.tokens.getHistory(ticker, options);
  }

  // ---------------------------------------------------------------------------
  // Adresses
  // ---------------------------------------------------------------------------

  /**
   * Retourne le solde d'un token spécifique pour une adresse.
   * @param address - Adresse Bitcoin
   * @param ticker  - Ticker du token (ex: "ORDI")
   */
  getBalance(address: string, ticker: string): Promise<AddressBalance> {
    return this.address.getBalance(address, ticker);
  }

  /**
   * Retourne tous les tokens détenus par une adresse (balance > 0).
   *
   * Inspecte l'historique complet de l'adresse pour identifier les tokens
   * touchés, puis fetch les balances actuelles en parallèle.
   *
   * @param address - Adresse Bitcoin
   */
  getTokens(address: string): Promise<AddressBalance[]> {
    return this.address.getTokens(address);
  }

  /**
   * Retourne l'historique des opérations BRC-20 d'une adresse.
   * @param address - Adresse Bitcoin
   * @param options - Filtres : ticker, opType, limit
   */
  getActivity(address: string, options?: ActivityOptions): Promise<Operation[]> {
    return this.address.getActivity(address, options);
  }

  // ---------------------------------------------------------------------------
  // Swap
  // ---------------------------------------------------------------------------

  /**
   * Liste les pools de swap disponibles.
   * @param options - Filtrer par src et/ou dst ticker
   */
  listPools(options?: ListPoolsOptions): Promise<Pool[]> {
    return this.swap.listPools(options);
  }

  /**
   * Récupère les réserves actuelles d'un pool.
   * @param poolId - ID canonique du pool, trié alphabétiquement (ex: "LOL-WTF")
   */
  getPoolReserves(poolId: string): Promise<Pool> {
    return this.swap.getPoolReserves(poolId);
  }

  /**
   * Simule un swap et retourne le montant de sortie attendu.
   * N'exécute rien on-chain — idéal pour un aperçu avant signature.
   *
   * @param src    - Ticker du token à vendre (ex: "LOL")
   * @param dst    - Ticker du token à recevoir (ex: "WTF")
   * @param amount - Montant à échanger en décimal (ex: "100.0")
   */
  getSwapQuote(src: string, dst: string, amount: string): Promise<SwapQuote> {
    return this.swap.getQuote(src, dst, amount);
  }

  /**
   * Retourne la TVL (Total Value Locked) d'un token dans le module Swap.
   * @param ticker - Ticker du token
   */
  getSwapTvl(ticker: string): Promise<TvlInfo> {
    return this.swap.getTvl(ticker);
  }

  /**
   * Liste les positions de swap avec filtres optionnels.
   * @param options - owner, src, dst, status, limit, offset
   */
  listSwapPositions(options?: ListPositionsOptions): Promise<SwapPosition[]> {
    return this.swap.listPositions(options);
  }

  /**
   * Retourne toutes les positions de swap d'une adresse.
   * @param owner   - Adresse Bitcoin
   * @param options - status, limit, offset
   */
  getOwnerSwapPositions(
    owner: string,
    options?: Omit<ListPositionsOptions, 'owner'>,
  ): Promise<SwapPosition[]> {
    return this.swap.getOwnerPositions(owner, options);
  }
}
