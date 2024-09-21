import { TestBed } from '@angular/core/testing';

import { BundleRepository } from './bundle-repository.service';

describe('BundleRepositoryService', () => {
  let service: BundleRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BundleRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
