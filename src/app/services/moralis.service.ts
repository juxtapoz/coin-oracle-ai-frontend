import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, forkJoin, from } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { TokenPair } from '../interfaces/token.interface';
import { TokenProvider } from './token-provider.interface';
import { Connection, PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';

@Injectable({
  providedIn: 'root'
})
export class MoralisService implements TokenProvider {
  private readonly BASE_URL = 'https://solana-gateway.moralis.io';
  private readonly API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImU5ODJhYzc3LWIzY2QtNDBjOC05MmQwLWQwM2Q2ZDdmNDE1ZCIsIm9yZ0lkIjoiMTE4ODY4IiwidXNlcklkIjoiMTE4NTE0IiwidHlwZUlkIjoiNWQ3YzUzZDgtZjQ4Mi00ZDE4LTk3OGYtZDcwNDM1NTM4NWU4IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3MTM4MzExOTcsImV4cCI6NDg2OTU5MTE5N30.3WEUiHHfb11u3pHtwxPXRZfqudJbWNNWaw_0fyFxsiE';
  private readonly connection: Connection;

  constructor(private http: HttpClient) {
    this.connection = new Connection('https://solana.publicnode.com');
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders()
      .set('accept', 'application/json')
      .set('X-API-Key', this.API_KEY);
  }

  private cleanAddress(address: string): string {
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
          return of([]);
        }

        return forkJoin({
          metadata: of(metadata),
          price: this.getTokenPriceData(query),
          pairs: this.getTokenPairs(query)
        }).pipe(
          switchMap(data => {
            const mintAddress = data.metadata.mint || data.metadata.address;
            if (mintAddress) {
              // Try to get Solana image if we have a mint address
              return from(this.getSolanaTokenImage(mintAddress)).pipe(
                map(solanaImage => ({...data, solanaImage}))
              );
            }
            return of({...data, solanaImage: null});
          }),
          map(data => {
            const firstPair = data.pairs?.pairs?.[0];
            const price = data.price?.usdPrice || 0;

            const exchangeName = firstPair?.exchangeName || 'Unknown';
            const exchangeLogo = firstPair?.exchangeLogo || '/assets/icons/default-exchange.svg';

            const totalSupply = parseFloat(data.metadata?.supply || '0');
            const fullyDilutedValue = price * totalSupply;

            const tokenImage = data.solanaImage || 
                             data.metadata.thumbnail || 
                             data.metadata.logo || 
                             data.metadata.image || 
                             '/assets/icons/default-token.svg';

            return [{
              tokenAddress: data.metadata.mint || data.metadata.address || '',
              pairAddress: firstPair?.pairAddress || '',
              exchange: exchangeName,
              exchangeLogo: exchangeLogo,
              price: price,
              marketCap: 0,
              fullyDilutedValue: fullyDilutedValue,
              liquidity: firstPair?.liquidity || 0,
              volume24h: firstPair?.volume24h || 0,
              priceChange1h: data.price?.priceChange1h || 0,
              priceChange24h: data.price?.priceChange24h || 0,
              tokenIcon: tokenImage,
              tokenName: data.metadata.name || 'Unknown Token',
              tokenSymbol: data.metadata.symbol || '???'
            }];
          })
        );
      }),
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

  private async getSolanaTokenImage(mintAddress: string): Promise<string | null> {
    try {
      const mint = new PublicKey(mintAddress);
      // Get metadata account address
      const metadataAddress = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(),
          mint.toBuffer()
        ],
        new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
      )[0];

      // Get metadata account info
      const accountInfo = await this.connection.getAccountInfo(metadataAddress);
      if (!accountInfo) return null;

      // Parse metadata URI from account data
      const metadataUri = this.decodeMetadata(accountInfo.data);
      if (!metadataUri) return null;

      // Fetch metadata JSON
      const response = await fetch(metadataUri);
      const json = await response.json();
      return json.image || null;
    } catch (error) {
      console.error('Error fetching Solana token image:', error);
      return null;
    }
  }

  private decodeMetadata(data: Buffer): string | null {
    try {
      // Create a DataView for safer buffer reading
      const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);
      
      // Skip the first byte (prefix)
      let offset = 1;
      
      // Skip update authority (32 bytes)
      offset += 32;
      
      // Skip mint address (32 bytes)
      offset += 32;
      
      // Read name length (4 bytes)
      const nameLength = dataView.getUint32(offset, true);
      offset += 4;
      
      // Skip name content
      offset += nameLength;
      
      // Read symbol length (4 bytes)
      const symbolLength = dataView.getUint32(offset, true);
      offset += 4;
      
      // Skip symbol content
      offset += symbolLength;
      
      // Read URI length (4 bytes)
      const uriLength = dataView.getUint32(offset, true);
      offset += 4;
      
      // Read URI content
      const uri = new TextDecoder().decode(data.slice(offset, offset + uriLength));
      
      return uri.replace(/\0/g, ''); // Remove null characters if any
    } catch (error) {
      console.error('Error decoding metadata:', error);
      return null;
    }
  }
} 