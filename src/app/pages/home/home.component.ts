import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { TokenSearchComponent } from '../../components/token-search/token-search.component';

const SOLANA_ICON = `
<svg width="100%" height="100%" viewBox="0 0 397 311" version="1.1" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(-1.000000, 0.000000)" fill="#FFFFFF">
    <path d="M64.6,237.9c2.4-2.4,5.7-3.8,9.2-3.8h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,237.9z"/>
    <path d="M64.6,3.8C67.1,1.4,70.4,0,73.8,0h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,3.8z"/>
    <path d="M328.4,120.9c-2.4-2.4-5.7-3.8-9.2-3.8H1.9c-5.8,0-8.7,7-4.6,11.1l62.7,62.7c2.4,2.4,5.7,3.8,9.2,3.8h317.4c5.8,0,8.7-7,4.6-11.1L328.4,120.9z"/>
  </g>
</svg>`;

interface Blockchain {
  id: string;
  name: string;
  symbol: string;
  iconName: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    TokenSearchComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  features = [
    {
      icon: 'security',
      title: 'Risk Assessment',
      description: 'Advanced AI analysis of token contracts and creator wallets to identify potential risks.'
    },
    {
      icon: 'trending_up',
      title: 'Market Analysis',
      description: 'Comprehensive market data analysis including liquidity, volume, and price trends.'
    },
    {
      icon: 'groups',
      title: 'Social Insights',
      description: 'Analysis of social media sentiment and community engagement metrics.'
    }
  ];

  blockchains: Blockchain[] = [
    {
      id: 'solana',
      name: 'Solana',
      symbol: 'SOL',
      iconName: 'solana-icon'
    }
  ];

  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) {
    this.matIconRegistry.addSvgIconLiteral(
      'solana-icon',
      this.domSanitizer.bypassSecurityTrustHtml(SOLANA_ICON)
    );
  }
}
