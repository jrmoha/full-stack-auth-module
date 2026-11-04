import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({
    example: 'dana@company.com',
    maxLength: 254,
    description: 'Trimmed and lowercased',
  })
  @NormalizeEmail()
  @IsPresentString(MESSAGES.emailRequired)
  @MaxChars(254, MESSAGES.emailMax)
  @IsSpecEmail(MESSAGES.emailFormat)
  email!: string;

  @ApiProperty({ example: 'Dana Levi', minLength: 3, maxLength: 50, description: 'Trimmed' })
  @TrimString()
  @IsPresentString(MESSAGES.nameRequired)
  @MinChars(3, MESSAGES.nameMin)
  @MaxChars(50, MESSAGES.nameMax)
  name!: string;

  @ApiProperty({
    example: 'Str0ng!pass',
    minLength: 8,
    maxLength: 128,
    description:
      'At least one letter (A-Z, a-z), one digit and one special character; never trimmed',
  })
  @IsPresentString(MESSAGES.passwordRequired)
  @MinChars(8, MESSAGES.passwordMin)
  @MaxChars(128, MESSAGES.passwordMax)
  @ContainsLetter(MESSAGES.passwordLetter)
  @ContainsDigit(MESSAGES.passwordDigit)
  @ContainsSpecial(MESSAGES.passwordSpecial)
  password!: string;
}
