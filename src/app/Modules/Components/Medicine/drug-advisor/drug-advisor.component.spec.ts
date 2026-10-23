import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrugAdvisorComponent } from './drug-advisor.component';

describe('DrugAdvisorComponent', () => {
  let component: DrugAdvisorComponent;
  let fixture: ComponentFixture<DrugAdvisorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DrugAdvisorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DrugAdvisorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
