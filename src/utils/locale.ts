// Locale contract helpers — `meta.locale` is a BCP-47 tag viewers use for
// `lang`/`dir` and Intl formatting. Validation is structural, not exhaustive:
// Intl.Locale accepts what the runtime can parse.

export function isValidLocale(tag: string): boolean {
  try {
    new Intl.Locale(tag)
    return true
  } catch {
    return false
  }
}

const RTL_SUBTAGS = new Set([
  'ar', 'fa', 'he', 'ku', 'ps', 'ur', 'yi', 'dv', 'ckb', 'sd', 'ug', 'syr', 'nqo',
])

export function isRtlLocale(tag: string): boolean {
  try {
    return RTL_SUBTAGS.has(new Intl.Locale(tag).language.toLowerCase())
  } catch {
    return false
  }
}
