import {
  ContainsDigit,
  ContainsLetter,
  ContainsSpecial,
  IsPresentString,
  IsSpecEmail,
  MaxChars,
  MinChars,
} from '../validators/rules.js';
import { MESSAGES } from './messages.js';
import { NormalizeEmail, TrimString } from './normalize.js';

/** POST /auth/signup body. Rules in architecture §4 table order. */
export class SignupDto {
  @NormalizeEmail()
  @IsPresentString(MESSAGES.emailRequired)
  @MaxChars(254, MESSAGES.emailMax)
  @IsSpecEmail(MESSAGES.emailFormat)
  email!: string;

  @TrimString()
  @IsPresentString(MESSAGES.nameRequired)
  @MinChars(3, MESSAGES.nameMin)
  @MaxChars(50, MESSAGES.nameMax)
  name!: string;

  @IsPresentString(MESSAGES.passwordRequired)
  @MinChars(8, MESSAGES.passwordMin)
  @MaxChars(128, MESSAGES.passwordMax)
  @ContainsLetter(MESSAGES.passwordLetter)
  @ContainsDigit(MESSAGES.passwordDigit)
  @ContainsSpecial(MESSAGES.passwordSpecial)
  password!: string;
}
