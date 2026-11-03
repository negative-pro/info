import { describe, expect, it } from 'vitest'
import { youtubeThumbnail } from './youtube'

describe('YouTube thumbnails', () => {
  it.each([
    'https://www.youtube.com/watch?v=BYCi1wH2Aug',
    'https://youtu.be/BYCi1wH2Aug?t=5',
    'https://www.youtube.com/shorts/BYCi1wH2Aug',
    'https://www.youtube.com/embed/BYCi1wH2Aug',
  ])('extracts the video ID from %s', url => {
    expect(youtubeThumbnail(url)).toBe('https://i.ytimg.com/vi/BYCi1wH2Aug/hqdefault.jpg')
  })
  it.each([null, 'invalid', 'https://youtube.com.evil.test/watch?v=BYCi1wH2Aug', 'https://www.youtube.com/watch?v=invalid', 'javascript:alert(1)'])('rejects invalid URL %s', url => {
    expect(youtubeThumbnail(url)).toBeNull()
  })
})
