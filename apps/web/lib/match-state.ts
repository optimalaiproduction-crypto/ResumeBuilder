const MATCH_INPUT_KEY_PREFIX = "resumeforge.match-input.";

function getMatchInputKey(resumeId: string) {
  return `${MATCH_INPUT_KEY_PREFIX}${resumeId}`;
}

export function readHasMatchInput(resumeId: string) {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return localStorage.getItem(getMatchInputKey(resumeId)) === "1";
  } catch {
    return false;
  }
}

export function writeHasMatchInput(resumeId: string, hasInput: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const key = getMatchInputKey(resumeId);
    if (hasInput) {
      localStorage.setItem(key, "1");
      return;
    }
    localStorage.removeItem(key);
  } catch {
    // Ignore storage errors so match page UI never crashes.
  }
}
