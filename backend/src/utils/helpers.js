// Escapes user input for safe use inside a RegExp.
export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Case-insensitive "contains" matcher for search boxes.
export const containsRegex = (value) => new RegExp(escapeRegex(value.trim()), 'i');

// Copies only the listed keys that are present in the source object.
export const pick = (source, keys) =>
  Object.fromEntries(keys.filter((key) => source[key] !== undefined).map((key) => [key, source[key]]));

// Query params can arrive as arrays (?a=1&a=2); only accept plain strings.
export const queryString = (value) => (typeof value === 'string' && value.trim() ? value.trim() : undefined);

export const toId = (value) => (value?._id ?? value)?.toString();

export const sameId = (a, b) => Boolean(a && b) && toId(a) === toId(b);
