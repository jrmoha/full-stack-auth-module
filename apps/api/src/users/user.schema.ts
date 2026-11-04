import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

/** `users` collection (architecture §4). Writes go through UsersService only. */
// autoIndex/autoCreate pinned: boot depends on the unique index being built (architecture §7).
@Schema({
  collection: 'users',
  timestamps: true,
  versionKey: false,
  autoIndex: true,
  autoCreate: true,
})
export class User {
  @Prop({ required: true, trim: true, lowercase: true, maxlength: 254, unique: true })
  email!: string;

  @Prop({ required: true, trim: true, minlength: 3, maxlength: 50 })
  name!: string;

  /** argon2id hash. Excluded from queries unless selected explicitly. */
  @Prop({ required: true, select: false })
  passwordHash!: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
