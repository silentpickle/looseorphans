// The story's names as data. Text in src/data holds {tokens}; fmt() fills them in from cast.toml (and cast.local.toml
// when it exists), which vite.config.ts bakes in as __CAST__. {m1} is a member's name, {m1.pet} one of their fields
// (nick, given, initial, pet), {meter} a shared term, and a trailing |upper shouts it.
export const CAST = __CAST__;

const TOKEN = /\{([A-Za-z0-9_]+(?:\.[a-z]+)?)(\|upper)?\}/g;
const FIELD_SEPARATOR = ".";

function lookup(key: string): string | undefined {
  const [id, field] = key.split(FIELD_SEPARATOR);
  const member = id === undefined ? undefined : CAST.members[id];
  if (member !== undefined) return field === undefined ? member.name : member[field];
  return CAST.terms[key];
}

/** The text with every known token replaced; an unknown {brace} is left as it is. */
export function fmt(text: string): string {
  return text.replace(TOKEN, (whole: string, key: string, shout: string | undefined) => {
    const value = lookup(key);
    if (value === undefined) return whole;
    return shout === undefined ? value : value.toUpperCase();
  });
}

/** Every string in a data tree (keys too) through fmt(); functions and other values pass through untouched. */
export function fmtDeep<T>(value: T): T {
  if (typeof value === "string") return fmt(value) as T;
  if (Array.isArray(value)) return value.map((item: unknown) => fmtDeep(item)) as T;
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [fmt(key), fmtDeep(item)])) as T;
}
