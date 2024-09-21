import { TestBed } from '@angular/core/testing';

import { SaveBundleFormService } from './save-bundle-form.service';

describe('SaveBundleFormService', () => {
  let service: SaveBundleFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SaveBundleFormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
