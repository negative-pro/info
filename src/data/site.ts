import details from './site.json'
import text from '../content/ar/texts.json'

/** Shared identity and contact details; brand names reuse the interface labels. */
export const site = { ...details, brand: text.brand, brandLatin: text.brandLatin }

export function siteText(template: string): string {
  return template.replace(/\{(email|location|brand|brandLatin)\}/g, (_, key: keyof typeof site) => site[key])
}
