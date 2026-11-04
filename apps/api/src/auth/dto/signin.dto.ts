import { IsPresentString, IsSpecEmail, MaxChars } from '../validators/rules.js';
import { MESSAGES } from './messages.js';
import { NormalizeEmail } from './normalize.js';

/** POST /auth/signin body. No complexity rules: signin never reveals the policy (architecture §4). */
export class SigninDto {
  @NormalizeEmail()
  @IsPresentString(MESSAGES.emailRequired)
  @MaxChars(254, MESSAGES.emailMax)
  @IsSpecEmail(MESSAGES.emailFormat)
  email!: string;

  @IsPresentString(MESSAGES.passwordRequired)
  @MaxChars(128, MESSAGES.passwordMax)
  password!: string;
}
