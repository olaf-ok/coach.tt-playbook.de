export function decodeCode(input: string): string | null {
  const trimmed = input.trim();

  if (/^\d{4}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    const code = url.searchParams.get('code');
    if (code && /^\d{4}$/.test(code)) return code;
  } catch {
    // not a URL
  }

  return null;
}
