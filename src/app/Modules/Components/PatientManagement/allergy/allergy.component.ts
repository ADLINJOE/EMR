import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common'; // ✅ Add NgFor
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-allergy',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgFor, // ✅ Required for *ngFor
  ],
  templateUrl: './allergy.component.html',
  styleUrls: ['./allergy.component.scss']
})
export class AllergyComponent implements OnInit {
  private fb = inject(FormBuilder);

  form: FormGroup = this.fb.group({
    AllergyList: this.fb.array([this.createAllergy()])
  });

  ngOnInit(): void {}

  get getFormControls(): FormArray {
    return this.form.get('AllergyList') as FormArray;
  }

  createAllergy(): FormGroup {
    return this.fb.group({
      description: ['']
    });
  }

  addAllergy() {
    this.getFormControls.push(this.createAllergy());
  }

  removeAllergy(index: number) {
    this.getFormControls.removeAt(index);
  }

  trackByIndex(index: number): number {
    return index;
  }
}
