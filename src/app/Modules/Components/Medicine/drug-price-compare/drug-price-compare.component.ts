import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SharedServiceService } from '../../../../Service/Sharedservice/shared-service.service';
import { CommonService } from '../../../../Service/common.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-drug-price-compare',
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './drug-price-compare.component.html',
  styleUrl: './drug-price-compare.component.scss'
})
export class DrugPriceCompareComponent {
form!: FormGroup;
  results: any[] = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private http: CommonService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      search: ['']
    });
  }
cancel(){
  
}
  searchMedicine() {
    const query = this.form.value.search.trim();
    if (!query) return;

    this.loading = true;
   this.http.Post('Drug/DrugCompare', { drugname: query }).subscribe({
  next: (data: any) => {
    this.results = data.sort((a:any, b:any) => a.unitPrice - b.unitPrice);
    this.loading = false;
  },
  error: () => (this.loading = false)
});

  }
}
