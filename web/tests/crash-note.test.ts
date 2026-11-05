// A missing music track is silence, not a crash; everything else still gets the note.
import { describe, expect, it } from "vitest";
import { isAudioDecodeFailure } from "../src/ui/crash-note";

describe("crash note", () => {
  it("C1_missing_track: an audio decode failure is not a crash", () => {
    expect(isAudioDecodeFailure(new DOMException("Unable to decode audio data", "EncodingError"))).toBe(true);
  });
  it("C2_real_errors: other errors still are", () => {
    expect(isAudioDecodeFailure(new DOMException("blocked", "SecurityError"))).toBe(false);
    expect(isAudioDecodeFailure(new Error("EncodingError"))).toBe(false);
  });
});
