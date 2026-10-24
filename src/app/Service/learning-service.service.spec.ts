import { TestBed } from '@angular/core/testing';

import { LearningServiceService } from './learning-service.service';

describe('LearningServiceService', () => {
  let service: LearningServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LearningServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
