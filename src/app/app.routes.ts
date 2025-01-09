import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { SwarmComponent } from './pages/swarm/swarm.component';
import { ReportComponent } from './pages/report/report.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'swarm', component: SwarmComponent },
  { path: 'report', component: ReportComponent },
  { path: '**', redirectTo: '' }
];
