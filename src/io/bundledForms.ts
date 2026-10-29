// The published forms compiled into the app (forms/<id>/<version>.json + forms/published.json).
// Drafts in form-drafts/ are never bundled. The registry check runs at start, so a broken bundle
// shows an error instead of a half-working app.
import published from '../../forms/published.json';
import { buildFormRegistry, type RegistryResult } from '../logic/formRegistry';

const files = import.meta.glob<unknown>('../../forms/*/*.json', { eager: true, import: 'default' });

export const BUNDLED_FORMS: RegistryResult = buildFormRegistry(
  Object.entries(files).map(([name, raw]) => ({ name, raw })),
  published,
);
