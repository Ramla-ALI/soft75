export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Parse a whole number from a route parameter and check its range. */
export function intParam(value, name, min, max) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new HttpError(400, `${name} must be a whole number from ${min} to ${max}.`);
  }
  return n;
}

/**
 * Keep only the allowed fields from a request body and check each one's type.
 * `spec` maps field name -> checker function that returns the cleaned value or throws.
 */
export function pick(body, spec) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Send a JSON object.');
  }
  const out = {};
  for (const [key, check] of Object.entries(spec)) {
    if (key in body) out[key] = check(body[key], key);
  }
  if (Object.keys(out).length === 0) {
    throw new HttpError(400, `Send at least one of: ${Object.keys(spec).join(', ')}.`);
  }
  return out;
}

export const bool = (v, key) => {
  if (typeof v !== 'boolean') throw new HttpError(400, `${key} must be true or false.`);
  return v ? 1 : 0;
};

export const text = (max) => (v, key) => {
  if (typeof v !== 'string') throw new HttpError(400, `${key} must be text.`);
  if (v.length > max) throw new HttpError(400, `${key} must be ${max} characters or fewer.`);
  return v;
};

export const intRange = (min, max) => (v, key) => {
  if (!Number.isInteger(v) || v < min || v > max) throw new HttpError(400, `${key} must be a whole number from ${min} to ${max}.`);
  return v;
};

export const oneOf = (...options) => (v, key) => {
  if (v !== null && !options.includes(v)) throw new HttpError(400, `${key} must be one of: ${options.join(', ')} (or null).`);
  return v;
};
