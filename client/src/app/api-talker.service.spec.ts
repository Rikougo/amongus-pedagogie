import { TestBed } from '@angular/core/testing';

import { ApiTalkerService } from './api-talker.service';

describe('ApiTalkerService', () => {
  let service: ApiTalkerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiTalkerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
