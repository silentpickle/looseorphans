// If anything throws, show the error on screen instead of freezing silently, so a player can say what broke.
const STYLE = `
#crash { position: fixed; z-index: 20; left: 50%; transform: translateX(-50%);
  bottom: calc(env(safe-area-inset-bottom, 0px) + 12px); max-width: min(92vw, 560px); padding: 10px 14px;
  border: 2px solid #ff6666; border-radius: 8px; background: rgba(6, 10, 31, 0.95); color: #fff;
  font: 13px/1.4 "Courier New", monospace; }
#crash strong { color: #ffd166; }
`;
const MAX_STACK_LINES = 3;

function describe(error: unknown): string {
  if (error instanceof Error) {
    const where = (error.stack ?? "")
      .split("\n")
      .slice(1, MAX_STACK_LINES + 1)
      .join(" / ");
    return `${error.name}: ${error.message}${where === "" ? "" : ` (${where.trim()})`}`;
  }
  return String(error);
}

function show(error: unknown): void {
  const note = document.getElementById("crash") ?? document.body.appendChild(document.createElement("div"));
  note.id = "crash";
  note.innerHTML = "";
  const title = document.createElement("strong");
  title.textContent = "Something broke. Reload to continue from your last save. ";
  const detail = document.createElement("span");
  detail.textContent = describe(error);
  note.append(title, detail);
}

/**
 * A track that isn't there yet (or isn't audio) fails to decode. Phaser already plays silence for it, but the
 * browser's decode promise rejects with nobody listening; that is not a crash, so it gets no note.
 */
export function isAudioDecodeFailure(reason: unknown): boolean {
  return reason instanceof DOMException && reason.name === "EncodingError";
}

export function watchForCrashes(): void {
  document.head.append(Object.assign(document.createElement("style"), { textContent: STYLE }));
  window.addEventListener("error", (event) => {
    show(event.error ?? event.message);
  });
  window.addEventListener("unhandledrejection", (event) => {
    if (isAudioDecodeFailure(event.reason)) return;
    show(event.reason);
  });
}
