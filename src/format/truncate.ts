export function truncate(text: string, max: number, full: boolean): string {
  if (full || text.length <= max) return text;
  return `${text.slice(0, max)}… (+${text.length - max} chars, use --full)`;
}
