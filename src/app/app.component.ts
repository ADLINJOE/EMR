import { Component, HostListener } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SpinnerComponent } from './Security/spinner/spinner.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,SpinnerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'EMR';
  constructor(private router: Router) {}
  ngOnInit(): void {
    // ✅ Detect browser refresh using PerformanceNavigation API
    const navType = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (navType && navType.type === 'reload') {
      // Browser refresh happened
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(event: PopStateEvent) {
    // Force redirect to login page on browser back
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
