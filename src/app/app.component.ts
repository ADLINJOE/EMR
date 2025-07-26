import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SpinnerComponent } from './Security/spinner/spinner.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,SpinnerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'EMR';
}
