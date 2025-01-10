import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { TokenPair } from '../interfaces/token.interface';
import { TokenProvider } from './token-provider.interface';

interface TokenData {
  metadata: any;
  price: any;
  pairs: any;
}

@Injectable({
  providedIn: 'root'
})
export class MoralisService implements TokenProvider {
  private readonly BASE_URL = 'https://solana-gateway.moralis.io';
  private readonly API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImU5ODJhYzc3LWIzY2QtNDBjOC05MmQwLWQwM2Q2ZDdmNDE1ZCIsIm9yZ0lkIjoiMTE4ODY4IiwidXNlcklkIjoiMTE4NTE0IiwidHlwZUlkIjoiNWQ3YzUzZDgtZjQ4Mi00ZDE4LTk3OGYtZDcwNDM1NTM4NWU4IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3MTM4MzExOTcsImV4cCI6NDg2OTU5MTE5N30.3WEUiHHfb11u3pHtwxPXRZfqudJbWNNWaw_0fyFxsiE';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders()
      .set('accept', 'application/json')
      .set('X-API-Key', this.API_KEY);
  }

  private cleanAddress(address: string): string {
    // Remove any URLs or API paths that might have been included
    const cleanedAddress = address.replace(/https?:\/\/[^\/]+\/[^\/]+\/[^\/]+\//, '');
    console.log('Cleaned address:', cleanedAddress);
    return cleanedAddress;
  }

  private getTokenMetadata(address: string): Observable<any> {
    const cleanedAddress = this.cleanAddress(address);
    const endpoint = `${this.BASE_URL}/token/mainnet/${cleanedAddress}/metadata`;
    console.log('Metadata endpoint:', endpoint);
    return this.http.get<any>(endpoint, { headers: this.getHeaders() }).pipe(
      tap(response => {
        console.log('Metadata response:', response);
        console.log('Token image sources:', {
          thumbnail: response?.thumbnail,
          logo: response?.logo,
          image: response?.image
        });
      }),
      catchError(error => {
        console.error('Error fetching token metadata:', error);
        return of(null);
      })
    );
  }

  private getTokenPriceData(address: string): Observable<any> {
    const cleanedAddress = this.cleanAddress(address);
    const endpoint = `${this.BASE_URL}/token/mainnet/${cleanedAddress}/price`;
    console.log('Price endpoint:', endpoint);
    return this.http.get<any>(endpoint, { headers: this.getHeaders() }).pipe(
      tap(response => console.log('Price response:', response)),
      catchError(error => {
        console.error('Error fetching token price:', error);
        return of(null);
      })
    );
  }

  private getTokenPairs(address: string): Observable<any> {
    const cleanedAddress = this.cleanAddress(address);
    const endpoint = `${this.BASE_URL}/token/mainnet/${cleanedAddress}/pairs`;
    console.log('Pairs endpoint:', endpoint);
    return this.http.get<any>(endpoint, { headers: this.getHeaders() }).pipe(
      tap(response => console.log('Pairs response:', response)),
      catchError(error => {
        console.error('Error fetching token pairs:', error);
        return of(null);
      })
    );
  }

  searchToken(query: string, chain: string = 'solana'): Observable<TokenPair[]> {
    console.log('Searching for token:', query);

    return this.getTokenMetadata(query).pipe(
      switchMap(metadata => {
        if (!metadata) {
          return of<TokenData>({ metadata: null, price: null, pairs: null });
        }

        // Get additional data
        return forkJoin({
          metadata: of(metadata),
          price: this.getTokenPriceData(query),
          pairs: this.getTokenPairs(query)
        });
      }),
      map((data: TokenData) => {
        if (!data.metadata) {
          return [];
        }

        const firstPair = data.pairs?.pairs?.[0];
        const price = data.price?.usdPrice || 0;

        // Get exchange info from the first pair
        const exchangeName = firstPair?.exchangeName || 'Unknown';
        const exchangeLogo = firstPair?.exchangeLogo || 'assets/icons/default-exchange.svg';

        // Calculate FDV using total supply from metadata
        const totalSupply = parseFloat(data.metadata?.supply || '0');
        const fullyDilutedValue = price * totalSupply;

        return [{
          tokenAddress: data.metadata.mint || data.metadata.address || '',
          pairAddress: firstPair?.pairAddress || '',
          exchange: exchangeName,
          exchangeLogo: exchangeLogo,
          price: price,
          marketCap: 0, // We'll need to integrate with another service to get this data
          fullyDilutedValue: fullyDilutedValue,
          liquidity: firstPair?.liquidity || 0,
          volume24h: firstPair?.volume24h || 0,
          priceChange1h: data.price?.priceChange1h || 0,
          priceChange24h: data.price?.priceChange24h || 0,
          tokenIcon: data.metadata.thumbnail || data.metadata.logo || data.metadata.image || '/assets/icons/default-token.svg',
          tokenName: data.metadata.name || 'Unknown Token',
          tokenSymbol: data.metadata.symbol || '???'
        }];
      }),
      tap(results => console.log('Final processed results:', results)),
      catchError(error => {
        console.error('Error in token search:', error);
        return of([]);
      })
    );
  }

  getTokenPrice(address: string, chain: string = 'solana'): Observable<number> {
    return this.getTokenPriceData(address).pipe(
      map(response => response?.usdPrice || 0)
    );
  }
} 