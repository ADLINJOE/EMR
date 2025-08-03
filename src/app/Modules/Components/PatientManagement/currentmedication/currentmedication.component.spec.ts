import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentmedicationComponent } from './currentmedication.component';

describe('CurrentmedicationComponent', () => {
  let component: CurrentmedicationComponent;
  let fixture: ComponentFixture<CurrentmedicationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrentmedicationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurrentmedicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
