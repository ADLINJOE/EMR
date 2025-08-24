import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ADRComponent } from './adr.component';

describe('ADRComponent', () => {
  let component: ADRComponent;
  let fixture: ComponentFixture<ADRComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ADRComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ADRComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
