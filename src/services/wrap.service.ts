import { HttpClient } from '../utils/http';
import { RawWrapContract, WrapContract } from '../types/wrap.types';
import { normalizeWrapContract } from '../utils/normalize';

/**
 * Service gérant les endpoints du module Wrap (W) de l'indexeur Simplicity.
 *
 * Le token W est la représentation wrapped du protocole Universal Protocol.
 * Les contrats de wrap sont des adresses Taproot qui lockent des tokens
 * pour minter du W, permettant l'interopérabilité avec d'autres protocoles.
 *
 * Endpoints couverts :
 *   GET /v1/indexer/w/contracts   → listContracts()
 */
export class WrapService {
  constructor(private readonly http: HttpClient) {}

  /**
   * Retourne la liste de tous les contrats de wrap actifs et inactifs.
   *
   * Chaque contrat est une adresse Taproot qui gère le locking/unlocking
   * des tokens W sur le réseau Bitcoin.
   *
   * @example
   * const contracts = await client.listWrapContracts();
   * const active = contracts.filter(c => c.status === 'active');
   * console.log(`${active.length} contrats actifs`);
   * console.log('Adresse Taproot:', active[0].taprootAddress);
   */
  async listContracts(): Promise<WrapContract[]> {
    const raw = await this.http.get<RawWrapContract[]>('/v1/indexer/w/contracts');
    return raw.map(normalizeWrapContract);
  }
}
