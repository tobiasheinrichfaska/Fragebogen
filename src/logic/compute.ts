// Named pure functions that form definitions reference via `computed.fn` — data never carries code.
// The first functions arrive with the forms that need them (step 5); until then a computed field is
// rejected as referring to an unknown function.
import type { FieldValue } from './model';

export type ComputeFunction = (args: readonly FieldValue[]) => FieldValue;

export const COMPUTE_FUNCTIONS: Readonly<Record<string, ComputeFunction>> = {};
