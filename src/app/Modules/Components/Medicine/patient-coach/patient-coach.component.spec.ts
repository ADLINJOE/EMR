import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientCoachComponent } from './patient-coach.component';

describe('PatientCoachComponent', () => {
  let component: PatientCoachComponent;
  let fixture: ComponentFixture<PatientCoachComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientCoachComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientCoachComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
