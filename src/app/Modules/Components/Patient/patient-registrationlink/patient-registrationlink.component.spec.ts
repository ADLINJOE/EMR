import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientRegistrationlinkComponent } from './patient-registrationlink.component';

describe('PatientRegistrationlinkComponent', () => {
  let component: PatientRegistrationlinkComponent;
  let fixture: ComponentFixture<PatientRegistrationlinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientRegistrationlinkComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientRegistrationlinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
