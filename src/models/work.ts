/** Optional film or series metadata embedded in an item. */
export interface WorkDetails {
  title: string
  originalTitle: string | null
  type: 'film' | 'series'
  year: number | null
  /** Installment number within a film franchise; null/omitted when unknown. */
  partNumber?: number | null
  /** Total seasons of a series; null/omitted when unknown. */
  seasonCount?: number | null
  /** Specific season discussed by this item, distinct from the series total. */
  seasonNumber?: number | null
  cast?: string[]
  genres?: string[]
  countries?: string[]
  languages?: string[]
  /** Film duration in minutes; omitted for series. */
  runtimeMinutes?: number | null
  synopsis?: string | null
  franchise?: string | null
  directors: string[]
  writers: string[]
  editors: string[]
  providerIds: string[]
  imdb: { url: string; rating: number | null; ratingCount: number | null; checkedAt: string | null } | null
  sources: { label: string; url: string }[]
}
