import { describe, expect, it } from 'vitest'
import { matchesSearch, normalizeSearch } from './search'

describe('catalog search', () => {
  it('normalizes Arabic letter variants, diacritics and elongation', () => {
    expect(normalizeSearch('أَجْنَبِيّ')).toBe(normalizeSearch('اجنبي'))
    expect(normalizeSearch('إخــراج')).toBe(normalizeSearch('اخراج'))
  })
  it('matches mixed-language words in any order with either numeral style', () => {
    expect(matchesSearch('٢٠٢٦ RIP', ['The Rip (2026)'])).toBe(true)
    expect(matchesSearch('netflix ۲۰۲۶', ['Netflix', 2026])).toBe(true)
    expect(matchesSearch('rip unknown', ['The Rip (2026)'])).toBe(false)
  })
  it('handles empty text and punctuation safely', () => {
    expect(matchesSearch('   ', [null, undefined])).toBe(true)
    expect(matchesSearch('rip:2026', ['The Rip (2026)'])).toBe(true)
    expect(matchesSearch('xyz', [null])).toBe(false)
  })
})
