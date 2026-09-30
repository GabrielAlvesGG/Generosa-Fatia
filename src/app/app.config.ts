import {
  ApplicationConfig,
  LOCALE_ID,
  provideAppInitializer,
  inject,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { DemoOrderService, ORDER_GATEWAY } from './order.service';
import { CatalogRepository, CATALOG_GATEWAY, DemoCatalogService } from './catalog.service';
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    { provide: ORDER_GATEWAY, useExisting: DemoOrderService },
    { provide: CATALOG_GATEWAY, useExisting: DemoCatalogService },
    provideAppInitializer(() => inject(CatalogRepository).load()),
  ],
};
