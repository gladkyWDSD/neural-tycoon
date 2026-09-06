const BAD_WORDS = [
  'fuck',
  'fuk',
  'fck',
  'shit',
  'sh1t',
  'bitch',
  'b1tch',
  'cunt',
  'asshole',
  'ass',
  'dick',
  'cock',
  'pussy',
  'nigger',
  'nigga',
  'faggot',
  'fag',
  'retard',
  'whore',
  'slut',
  'bastard',
  'motherfucker',
  'goddamn',
  'damn',
  'hell',
  'crap',
  'bullshit',
  'piss',
  'twat',
  'wank',
]

function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/[^a-z]/g, '')
}

export function containsProfanity(input: string): boolean {
  const text = normalize(input)
  if (text.length === 0) return false
  return BAD_WORDS.some((word) => text.includes(word))
}

export function validateCompanyName(name: string): string | null {
  const trimmed = name.trim()
  if (trimmed.length === 0) return 'Company name cannot be empty.'
  if (trimmed.length > 24) return 'Company name must be 24 characters or fewer.'
  if (containsProfanity(trimmed)) return 'Please choose a professional company name.'
  return null
}
