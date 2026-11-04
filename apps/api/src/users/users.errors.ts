/** Raised by UsersService.create when the unique email index rejects the insert (Mongo error 11000). */
export class DuplicateEmailError extends Error {
  constructor() {
    super('A user with this email already exists.');
    this.name = 'DuplicateEmailError';
  }
}
