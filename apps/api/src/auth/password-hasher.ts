import { randomBytes } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import * as argon2 from 'argon2';

/** argon2id with library defaults (architecture §10). Injectable so tests can observe calls. */
@Injectable()
export class PasswordHasher {
  private readonly logger = new Logger(PasswordHasher.name);
  private dummyHash?: Promise<string>;

  hash(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  /**
   * False on mismatch and also on a malformed stored hash, so corrupt data cannot turn a wrong password into a
   * 500 that confirms the account exists.
   */
  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      this.logger.warn('A stored password hash could not be verified');
      return false;
    }
  }

  /**
   * Burns one verify against a real hash of a random secret, generated once with the same parameters as user
   * hashes, so unknown-email signins cost the same as real ones (architecture §10). Always false.
   */
  async verifyAgainstDummy(password: string): Promise<false> {
    this.dummyHash ??= this.hash(randomBytes(32).toString('hex'));
    await this.verify(await this.dummyHash, password);
    return false;
  }
}
