export function triggerHaptic(pattern: number | number[] = 8) {
  if (typeof window === "undefined" || typeof navigator === "undefined") return;
  if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore on unsupported browsers
    }
  }
}
