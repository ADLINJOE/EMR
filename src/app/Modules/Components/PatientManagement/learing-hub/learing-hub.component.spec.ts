import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LearingHubComponent } from './learing-hub.component';

describe('LearingHubComponent', () => {
  let component: LearingHubComponent;
  let fixture: ComponentFixture<LearingHubComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LearingHubComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LearingHubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
