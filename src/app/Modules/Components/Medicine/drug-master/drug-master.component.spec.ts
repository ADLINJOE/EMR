import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrugMasterComponent } from './drug-master.component';

describe('DrugMasterComponent', () => {
  let component: DrugMasterComponent;
  let fixture: ComponentFixture<DrugMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DrugMasterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DrugMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
