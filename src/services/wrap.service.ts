import { HttpClient } from '../utils/http';
import {
  RawWrapContract,
  RawWrapTvl,
  RawWrapMetrics,
  RawContractListResponse,
  WrapContract,
  WrapTvl,
  WrapMetrics,
  ListContractsOptions,
} from '../types/wrap.types';
import { normalizeWrapContract, normalizeWrapTvl, normalizeWrapMetrics } from '../utils/normalize';

/**
 * Service gérant les endpoints du module Wrap (W) de l'indexeur Simplicity.
 *
 * Le token W est la représentation wrapped du protocole Universal Protocol.
 * Les contrats de wrap sont des adresses Taproot qui verrouillent des tokens
 * pour minter du W, permettant l'interopérabilité avec d'autres protocoles.
 *
 * Endpoints couverts :
 *   GET /v1/indexer/w/contracts                       → listContracts()
 *   GET /v1/indexer/w/contracts/{script_address}      → getContract()
 *   GET /v1/indexer/w/tvl                             → getTvl()
 *   GET /v1/indexer/w/metrics                         → getMetrics()
 */
export class WrapService {
  constructor(private readonly http: HttpClient) {}

  /**
   * Retourne la liste des contrats de wrap avec filtres optionnels.
   *
   * @param options - Filtres : status, owner, limit, offset
   *
   * @example
   * const actifs = await client.listWrapContracts({ status: 'active' });
   * console.log(`${actifs.length} contrats actifs`);
   */
  async listContracts(options: ListContractsOptions = {}): Promise<WrapContract[]> {
    const raw = await this.http.get<RawContractListResponse>('/v1/indexer/w/contracts', {
      status: options.status,
      owner: options.owner,
      limit: options.limit,
      offset: options.offset,
    });
    return raw.items.map(normalizeWrapContract);
  }

  /**
   * Récupère les détails d'un contrat de wrap par son adresse script.
   *
   * @param scriptAddress - Adresse Taproot du contrat (bc1p...)
   *
   * @throws NotFoundError si le contrat n'existe pas
   *
   * @example
   * const contract = await client.getWrapContract('bc1p...');
   * console.log(contract.status); // 'active'
   */
  async getContract(scriptAddress: string): Promise<WrapContract> {
    const raw = await this.http.get<RawWrapContract>(
      `/v1/indexer/w/contracts/${encodeURIComponent(scriptAddress)}`,
    );
    return normalizeWrapContract(raw);
  }

  /**
   * Retourne la TVL (Total Value Locked) du module Wrap.
   *
   * @example
   * const tvl = await client.getWrapTvl();
   * console.log(`${tvl.remainingLocked} W verrouillés`);
   */
  async getTvl(): Promise<WrapTvl> {
    const raw = await this.http.get<RawWrapTvl>('/v1/indexer/w/tvl');
    return normalizeWrapTvl(raw);
  }

  /**
   * Retourne les métriques globales du module Wrap.
   *
   * @example
   * const metrics = await client.getWrapMetrics();
   * console.log(`TVL: ${metrics.tvlW} W, contrats actifs: ${metrics.activeContracts}`);
   */
  async getMetrics(): Promise<WrapMetrics> {
    const raw = await this.http.get<RawWrapMetrics>('/v1/indexer/w/metrics');
    return normalizeWrapMetrics(raw);
  }
}
