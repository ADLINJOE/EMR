// spinner.component.ts
import { Component } from '@angular/core';
import { SpinnerService } from '../../Service/SpinnerService/spinner.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
   imports: [CommonModule],
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss']
})
export class SpinnerComponent {
  constructor(public loadingService: SpinnerService) {}
}
