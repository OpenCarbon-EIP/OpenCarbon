import { ValidateIf } from 'class-validator';

// Leaves null and undefined untouched: `new Date(null)` would silently become the Unix epoch.
export const toDate = ({ value }: { value: unknown }): unknown =>
  value === null || value === undefined ? value : new Date(value as string);

// For update fields backed by a non-nullable column: may be omitted, but `null` is validated (and rejected).
export const IsOptionalNonNullable = (): PropertyDecorator =>
  ValidateIf((_object, value) => value !== undefined);
