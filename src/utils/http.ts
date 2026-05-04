import { ApiError, NotFoundError } from './errors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HttpClientOptions {
  /** URL de base de l'indexeur (ex: http://localhost:8080) */
  baseUrl: string;
  /** Clé API optionnelle — envoyée dans le header X-API-Key */
  apiKey?: string;
}

type QueryParams = Record<string, string | number | boolean | undefined | null>;

// ---------------------------------------------------------------------------
// Client HTTP
// ---------------------------------------------------------------------------

/**
 * Wrapper léger autour du fetch natif.
 *
 * Responsabilités :
 * - Construction des URLs avec query params
 * - Gestion des headers (Content-Type, X-API-Key)
 * - Normalisation des erreurs HTTP → ApiError / NotFoundError
 * - Parsing JSON de la réponse
 *
 * N'expose PAS fetch directement — le reste du SDK passe toujours par ici.
 */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(options: HttpClientOptions) {
    // Supprimer le slash final pour éviter les doubles slashes dans les URLs
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');

    this.headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.apiKey ? { 'X-API-Key': options.apiKey } : {}),
    };
  }

  /**
   * Effectue une requête GET et retourne le JSON parsé.
   *
   * @param path   - Chemin relatif (ex: /v1/indexer/brc20/list)
   * @param params - Query params optionnels (undefined/null ignorés)
   */
  async get<T>(path: string, params?: QueryParams): Promise<T> {
    const url = this.buildUrl(path, params);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
      });
    } catch (networkError) {
      // Erreur réseau (hors ligne, DNS, timeout...)
      throw new ApiError(
        0,
        `Impossible de joindre l'indexeur (${url}) : ${(networkError as Error).message}`,
      );
    }

    if (response.status === 404) {
      throw new NotFoundError(path);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => response.statusText);
      throw new ApiError(response.status, body);
    }

    return response.json() as Promise<T>;
  }

  // ---------------------------------------------------------------------------
  // Privé
  // ---------------------------------------------------------------------------

  private buildUrl(path: string, params?: QueryParams): string {
    const url = new URL(`${this.baseUrl}${path}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }
}
