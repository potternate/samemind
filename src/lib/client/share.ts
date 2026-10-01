export type ShareOutcome = "shared" | "copied" | "cancelled" | "blocked" | "failed";

export async function copyText(text: string): Promise<"copied" | "failed"> {
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}

export async function shareText(text: string, url?: string): Promise<ShareOutcome> {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title: "Same Mind", text, ...(url ? { url } : {}) });
      return "shared";
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return "cancelled";
      if (err instanceof Error && err.name === "NotAllowedError") return "blocked";
      return "failed";
    }
  }
  return copyText(url ? `${text}\n${url}` : text);
}
