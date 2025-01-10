import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap, takeUntil, tap, finalize } from 'rxjs/operators';
import { MoralisService } from '../../services/moralis.service';
import { TokenPair } from '../../interfaces/token.interface';

@Component({
  selector: 'app-token-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatCardModule
  ],
  templateUrl: './token-search.component.html',
  styleUrls: ['./token-search.component.scss']
})
export class TokenSearchComponent implements OnDestroy {
  searchControl = new FormControl('');
  searchResults$: Observable<TokenPair[]>;
  isLoading = false;
  private destroy$ = new Subject<void>();

  constructor(private moralisService: MoralisService) {
    console.log('TokenSearchComponent initialized');
    
    this.searchResults$ = this.searchControl.valueChanges.pipe(
      takeUntil(this.destroy$),
      tap(value => console.log('Search value changed:', value)),
      debounceTime(300),
      distinctUntilChanged(),
      filter((query): query is string => {
        const isValid = typeof query === 'string' && query.length > 2;
        console.log('Query valid:', isValid, 'Query:', query);
        return isValid;
      }),
      tap(() => {
        console.log('Setting loading state to true');
        this.isLoading = true;
      }),
      switchMap(query => {
        console.log('Making API call for query:', query);
        return this.moralisService.searchToken(query).pipe(
          tap(results => console.log('Search results received:', results)),
          filter(results => {
            const hasResults = !!results;
            console.log('Results valid:', hasResults);
            return hasResults;
          }),
          finalize(() => {
            console.log('Setting loading state to false');
            this.isLoading = false;
          })
        );
      })
    );
  }

  onTokenSelected(event: any) {
    const token: TokenPair = event.option.value;
    console.log('Selected token:', token);
    // Here you can implement what happens when a token is selected
    // For example, navigate to the report page or trigger the AI analysis
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
} 