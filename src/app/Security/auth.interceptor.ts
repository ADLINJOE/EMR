import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { finalize } from 'rxjs';
import { SpinnerService } from '../Service/SpinnerService/spinner.service';

export const spinnerInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(SpinnerService);

  loadingService.show();

  return next(req).pipe(
    finalize(() => loadingService.hide())
  );
};
