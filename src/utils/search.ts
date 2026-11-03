/** Ignore Arabic vocalization, elongation, letter variants and numeral styles. */
export function normalizeSearch(value: string): string {
  return value.normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/ـ/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 0x06f0))
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

export function matchesSearch(query: string, fields: Array<string | number | null | undefined>): boolean {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean)
  const content = normalizeSearch(fields.filter(value => value != null).join(' '))
  return words.every(word => content.includes(word))
}
