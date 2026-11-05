// Tiny flag expressions for content: "a", "!a", "a&b&!c". Nothing more; content stays readable.
const AND = "&";
const NOT = "!";

export type Flags = Readonly<Record<string, boolean>>;

function term(flags: Flags, raw: string): boolean {
  const name = raw.trim();
  if (name.startsWith(NOT)) return !(flags[name.slice(1)] ?? false);
  return flags[name] ?? false;
}

export function holds(flags: Flags, condition: string | undefined): boolean {
  if (condition === undefined || condition.trim() === "") return true;
  return condition.split(AND).every((part) => term(flags, part));
}
