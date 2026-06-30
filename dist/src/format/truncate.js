export function truncate(text, max, full) {
    if (full || text.length <= max)
        return text;
    return `${text.slice(0, max)}… (+${text.length - max} chars, use --full)`;
}
//# sourceMappingURL=truncate.js.map