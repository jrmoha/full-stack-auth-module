/** Architecture §4 messages. Web and API use identical text. */
export const MESSAGES = {
  emailRequired: 'Email is required',
  emailMax: 'Email must be at most 254 characters',
  emailFormat: 'Enter a valid email address',
  nameRequired: 'Name is required',
  nameMin: 'Name must be at least 3 characters',
  nameMax: 'Name must be at most 50 characters',
  passwordRequired: 'Password is required',
  passwordMin: 'Password must be at least 8 characters',
  passwordMax: 'Password must be at most 128 characters',
  passwordLetter: 'Password must contain a letter',
  passwordDigit: 'Password must contain a number',
  passwordSpecial: 'Password must contain a special character',
} as const;
