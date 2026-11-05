// The browser storage boundary. It can throw (private mode, blocked storage), so this is the one try/catch.

/** The browser's localStorage, or null when it is missing or refuses access. */
export function storage(): Storage | null {
  try {
    return globalThis.localStorage;
  } catch (error: unknown) {
    if (error instanceof DOMException || error instanceof ReferenceError) return null;
    throw error;
  }
}
