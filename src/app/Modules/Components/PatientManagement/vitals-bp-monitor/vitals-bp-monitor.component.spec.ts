import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VitalsBpMonitorComponent } from './vitals-bp-monitor.component';

describe('VitalsBpMonitorComponent', () => {
  let component: VitalsBpMonitorComponent;
  let fixture: ComponentFixture<VitalsBpMonitorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VitalsBpMonitorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VitalsBpMonitorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
