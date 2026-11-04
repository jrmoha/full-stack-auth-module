import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, type Model } from 'mongoose';
import type { PublicUser } from './public-user.js';
import { User, type UserDocument } from './user.schema.js';
import { DuplicateEmailError } from './users.errors.js';

export interface NewUser {
  email: string;
  name: string;
  passwordHash: string;
}

const DUPLICATE_KEY = 11000;

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === DUPLICATE_KEY
  );
}

/** The only reader and writer of `users` (architecture §4). */
@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly users: Model<User>) {}

  /** Relies on the unique index; no pre-check query (architecture §8). */
  async create(input: NewUser): Promise<UserDocument> {
    try {
      return await this.users.create(input);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new DuplicateEmailError();
      }
      throw error;
    }
  }

  /** For signin only: the one query that selects the hash. Email is normalized like the schema does. */
  findByEmailWithHash(email: string): Promise<UserDocument | null> {
    return this.users.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash').exec();
  }

  /** For /auth/me. Hash excluded by the schema; an invalid id is treated as not found. */
  async findById(id: string): Promise<UserDocument | null> {
    if (!isValidObjectId(id)) {
      return null;
    }
    return this.users.findById(id).exec();
  }

  toPublicUser(user: UserDocument): PublicUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
