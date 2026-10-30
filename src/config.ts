// The Kanzlei configuration of this build (see config/README.md); neutral in the public repo.
import type { AppConfig } from './logic/appConfig';
import type { ExportMapping } from './logic/exportMapping';

export const APP_CONFIG: AppConfig = __KANZLEI_CONFIG__;

/** Mappings to payroll programs (config/export.local.json; empty in the public build). */
export const EXPORT_MAPPINGS: readonly ExportMapping[] = __EXPORT_MAPPINGS__;
