import spec from './openapi.json';
import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';

// Validates response bodies against the schemas from the API documentation
// (api/openapi.json – refresh with `npm run api:update-spec`).

export type SchemaName = keyof typeof spec.components.schemas;
// `ProductDto[]` = array of ProductDto
export type SchemaRef = SchemaName | `${SchemaName}[]`;

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
ajv.addFormat('password', true);
ajv.addSchema(spec, 'openapi');

const validators = new Map<SchemaRef, ValidateFunction>();

function getValidator(schema: SchemaRef): ValidateFunction {
  let validator = validators.get(schema);
  if (!validator) {
    const isArray = schema.endsWith('[]');
    const ref = {
      $ref: `openapi#/components/schemas/${schema.replace('[]', '')}`,
    };
    validator = ajv.compile(isArray ? { type: 'array', items: ref } : ref);
    validators.set(schema, validator);
  }
  return validator;
}

// Returns readable errors, e.g. `/0/stock must be number`; empty when the body is valid.
export function validateAgainstSchema(
  schema: SchemaRef,
  body: unknown,
): string[] {
  const validate = getValidator(schema);
  if (validate(body)) return [];
  return (validate.errors ?? []).map(
    (error) => `${error.instancePath || '(root)'} ${error.message ?? ''}`,
  );
}
