import { Observable } from 'rxjs';
import { TokenPair } from '../interfaces/token.interface';

export interface TokenProvider {
  searchToken(query: string, chain?: string): Observable<TokenPair[]>;
  getTokenPrice?(address: string, chain?: string): Observable<number>;
}

export enum TokenProviderType {
  SOLSCAN = 'solscan',
  MORALIS = 'moralis',
  COINGECKO = 'coingecko'
} 