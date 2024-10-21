import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { codeExtractorGuard } from './code-extractor.guard';

describe('codeExtractorGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => codeExtractorGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
