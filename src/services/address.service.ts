import { HttpClient } from '../utils/http';
import { AddressBalance, RawAddressBalance } from '../types/address.types';
import { RawOp, Operation } from '../types/brc20.types';
import { ActivityOptions, RawGetAllResponse } from '../types/common.types';
import { normalizeBalance, normalizeOp } from '../utils/normalize';

/**
 * Service gérant tous les appels API liés aux adresses Bitcoin.
 *
 * Endpoints couverts :
 *   GET /v1/indexer/address/{address}/brc20/{ticker}/info       → getBalance()
 *   GET /v1/indexer/address/{address}/history/all               → getTokens()
 *   GET /v1/indexer/address/{address}/history                   → getActivity()
 *   GET /v1/indexer/address/{address}/brc20/{ticker}/history    → getTickerHistory()
 */
export class AddressService {
  constructor(private readonly http: HttpClient) {}

  /**
   * Retourne le solde BRC-20 d'une adresse pour un ticker spécifique.
   *
   * @param address - Adresse Bitcoin (bc1p..., bc1q...)
   * @param ticker  - Ticker du token BRC-20 (ex: "ORDI", "W") — insensible à la casse
   *
   * @throws NotFoundError si l'adresse ou le ticker est inconnu de l'indexeur
   *
   * @example
   * const balance = await client.getBalance('bc1p...', 'ORDI');
   * console.log(balance.overallBalance);   // "1000.00000000"
   * console.log(balance.availableBalance); // "800.00000000"
   */
  async getBalance(address: string, ticker: string): Promise<AddressBalance> {
    const raw = await this.http.get<RawAddressBalance>(
      `/v1/indexer/address/${encodeURIComponent(address)}/brc20/${encodeURIComponent(ticker.toUpperCase())}/info`,
    );
    return normalizeBalance(raw);
  }

  /**
   * Retourne tous les tokens BRC-20 détenus par une adresse (balance > 0).
   *
   * Stratégie :
   * 1. Récupère tout l'historique de l'adresse pour identifier les tickers touchés
   * 2. Fetch les balances en parallèle pour chaque ticker unique
   * 3. Filtre les tokens dont le solde est nul (transférés intégralement)
   *
   * @param address - Adresse Bitcoin
   *
   * @example
   * const holdings = await client.getTokens('bc1p...');
   * holdings.forEach(b => console.log(`${b.ticker}: ${b.overallBalance}`));
   */
  async getTokens(address: string): Promise<AddressBalance[]> {
    // 1. Récupère tout l'historique pour identifier les tickers touchés
    const historyResponse = await this.http.get<RawGetAllResponse<RawOp>>(
      `/v1/indexer/address/${encodeURIComponent(address)}/history/all`,
    );

    // 2. Déduplique les tickers
    const tickers = [...new Set(historyResponse.data.map((op) => op.ticker))];

    // 3. Fetch les balances en parallèle — Promise.allSettled pour ne pas
    //    bloquer si un ticker retourne 404 (balance inexistante)
    const results = await Promise.allSettled(
      tickers.map((ticker) => this.getBalance(address, ticker)),
    );

    // 4. Garde uniquement les balances > 0
    return results
      .filter(
        (r): r is PromiseFulfilledResult<AddressBalance> =>
          r.status === 'fulfilled' && parseFloat(r.value.overallBalance) > 0,
      )
      .map((r) => r.value);
  }

  /**
   * Retourne l'historique des opérations BRC-20 impliquant une adresse.
   *
   * Inclut les opérations où l'adresse est expéditeur OU destinataire.
   *
   * @param address - Adresse Bitcoin
   * @param options - Filtres : ticker, opType, limit (défaut 100)
   *
   * @example
   * // Tous les transferts reçus sur ce ticker
   * const transfers = await client.getActivity('bc1p...', {
   *   ticker: 'ORDI',
   *   opType: 'transfer',
   * });
   */
  async getActivity(address: string, options: ActivityOptions = {}): Promise<Operation[]> {
    const raw = await this.http.get<RawOp[]>(
      `/v1/indexer/address/${encodeURIComponent(address)}/history`,
      {
        ticker: options.ticker,
        op_type: options.opType,
        limit: options.limit,
      },
    );
    return raw.map(normalizeOp);
  }

  /**
   * Retourne l'historique des opérations d'une adresse pour un token spécifique.
   *
   * Plus ciblé que `getActivity()` qui retourne tous les tokens confondus.
   *
   * @param address - Adresse Bitcoin
   * @param ticker  - Ticker du token BRC-20
   * @param options - Pagination : limit, skip
   *
   * @example
   * // Toutes les opérations ORDI de cette adresse
   * const history = await client.getAddressTickerHistory('bc1p...', 'ORDI');
   */
  async getTickerHistory(
    address: string,
    ticker: string,
    options: ActivityOptions = {},
  ): Promise<Operation[]> {
    const raw = await this.http.get<RawOp[]>(
      `/v1/indexer/address/${encodeURIComponent(address)}/brc20/${encodeURIComponent(ticker.toUpperCase())}/history`,
      {
        limit: options.limit,
        skip: options.skip,
      },
    );
    return raw.map(normalizeOp);
  }
}
