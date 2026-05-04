import { HttpClient } from './utils/http';
import { IndexerService } from './services/indexer.service';
import { TokenService } from './services/token.service';
import { AddressService } from './services/address.service';
import { SwapService } from './services/swap.service';
import { MempoolService } from './services/mempool.service';
import { ValidatorService } from './services/validator.service';
import { WrapService } from './services/wrap.service';
import { AddressBalance } from './types/address.types';
import { TokenInfo, Operation, IndexerStatus } from './types/brc20.types';
import {
  Pool,
  SwapPosition,
  TvlInfo,
  ListPositionsOptions,
  ListPoolsOptions,
} from './types/swap.types';
import { PendingResult } from './types/mempool.types';
import { ValidationResult } from './types/validator.types';
import { WrapContract } from './types/wrap.types';
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
  private readonly mempool: MempoolService;
  private readonly validator: ValidatorService;
  private readonly wrap: WrapService;

  constructor(options: UniversalClientOptions = {}) {
    const http = new HttpClient({
      baseUrl: options.baseUrl ?? 'http://localhost:8080',
      apiKey: options.apiKey,
    });

    this.indexer = new IndexerService(http);
    this.tokens = new TokenService(http);
    this.address = new AddressService(http);
    this.swap = new SwapService(http);
    this.mempool = new MempoolService(http);
    this.validator = new ValidatorService(http);
    this.wrap = new WrapService(http);
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

  /**
   * Récupère une position de swap par son identifiant unique.
   * @param id - Identifiant numérique de la position
   */
  getSwapPosition(id: number): Promise<SwapPosition> {
    return this.swap.getPosition(id);
  }

  /**
   * Retourne les positions de swap dont l'expiration approche.
   * @param options - limit, offset
   */
  getExpiringSwapPositions(
    options?: Pick<ListPositionsOptions, 'limit' | 'offset'>,
  ): Promise<SwapPosition[]> {
    return this.swap.getExpiringPositions(options);
  }

  // ---------------------------------------------------------------------------
  // Tokens — variantes /all, /tx/{txid}/history, /history-by-height
  // ---------------------------------------------------------------------------

  /**
   * Retourne TOUS les tokens BRC-20 (sans pagination).
   * Pour les listes longues, préférer `listTokens()` avec pagination.
   */
  listAllTokens(): Promise<TokenInfo[]> {
    return this.tokens.listAllTokens();
  }

  /**
   * Retourne TOUS les détenteurs d'un token (sans pagination).
   * @param ticker - Ticker du token
   */
  getAllTokenHolders(ticker: string): Promise<AddressBalance[]> {
    return this.tokens.getAllHolders(ticker);
  }

  /**
   * Retourne TOUT l'historique d'un token (sans pagination).
   * @param ticker - Ticker du token
   */
  getAllTokenHistory(ticker: string): Promise<Operation[]> {
    return this.tokens.getAllHistory(ticker);
  }

  /**
   * Retourne les opérations BRC-20 liées à une transaction Bitcoin précise.
   * @param ticker - Ticker du token
   * @param txid   - TXID de la transaction
   */
  getTokenHistoryByTx(ticker: string, txid: string): Promise<Operation[]> {
    return this.tokens.getHistoryByTx(ticker, txid);
  }

  /**
   * Retourne toutes les opérations BRC-20 indexées à une hauteur de bloc donnée.
   * @param height - Hauteur du bloc Bitcoin
   */
  getHistoryByHeight(height: number): Promise<Operation[]> {
    return this.tokens.getHistoryByHeight(height);
  }

  // ---------------------------------------------------------------------------
  // Adresses — variante par ticker
  // ---------------------------------------------------------------------------

  /**
   * Retourne l'historique des opérations d'une adresse pour un token spécifique.
   * @param address - Adresse Bitcoin
   * @param ticker  - Ticker du token BRC-20
   * @param options - limit, skip
   */
  getAddressTickerHistory(
    address: string,
    ticker: string,
    options?: ActivityOptions,
  ): Promise<Operation[]> {
    return this.address.getTickerHistory(address, ticker, options);
  }

  // ---------------------------------------------------------------------------
  // Mempool
  // ---------------------------------------------------------------------------

  /**
   * Vérifie les transferts BRC-20 non confirmés pour une adresse et un ticker.
   *
   * @param address - Adresse Bitcoin
   * @param ticker  - Ticker du token BRC-20
   *
   * @example
   * const pending = await client.checkPending('bc1p...', 'ORDI');
   * console.log(pending.pendingAmount); // montant en attente de confirmation
   */
  checkPending(address: string, ticker: string): Promise<PendingResult> {
    return this.mempool.checkPending(address, ticker);
  }

  // ---------------------------------------------------------------------------
  // Validator
  // ---------------------------------------------------------------------------

  /**
   * Valide une transaction de Wrap Mint (création de token W).
   *
   * @param txid - TXID de la transaction Bitcoin
   *
   * @example
   * const result = await client.validateWrapMint('a1b2c3...');
   * if (!result.valid) console.error(result.message);
   */
  validateWrapMint(txid: string): Promise<ValidationResult> {
    return this.validator.validateWrapMint(txid);
  }

  /**
   * Valide et dérive une adresse Bitcoin depuis un script witness Taproot.
   *
   * @param witness - Script witness Taproot (hex ou base64)
   *
   * @example
   * const result = await client.validateAddressFromWitness('5120...');
   * if (result.valid) console.log(result.address);
   */
  validateAddressFromWitness(witness: string): Promise<ValidationResult> {
    return this.validator.validateAddressFromWitness(witness);
  }

  // ---------------------------------------------------------------------------
  // Wrap (W)
  // ---------------------------------------------------------------------------

  /**
   * Retourne la liste de tous les contrats de wrap (token W).
   *
   * @example
   * const contracts = await client.listWrapContracts();
   * const active = contracts.filter(c => c.status === 'active');
   */
  listWrapContracts(): Promise<WrapContract[]> {
    return this.wrap.listContracts();
  }
}
