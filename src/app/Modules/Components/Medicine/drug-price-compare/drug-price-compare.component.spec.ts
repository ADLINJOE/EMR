import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrugPriceCompareComponent } from './drug-price-compare.component';

describe('DrugPriceCompareComponent', () => {
  let component: DrugPriceCompareComponent;
  let fixture: ComponentFixture<DrugPriceCompareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DrugPriceCompareComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DrugPriceCompareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
