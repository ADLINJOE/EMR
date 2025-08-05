import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientVitalsComponent } from './patient-vitals.component';

describe('PatientVitalsComponent', () => {
  let component: PatientVitalsComponent;
  let fixture: ComponentFixture<PatientVitalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientVitalsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientVitalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
