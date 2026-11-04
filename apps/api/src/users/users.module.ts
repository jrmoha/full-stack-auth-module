import { Module, type OnModuleInit } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { User, UserSchema } from './user.schema.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule implements OnModuleInit {
  constructor(@InjectModel(User.name) private readonly users: Model<User>) {}

  /** The API does not serve until the unique email index exists; a build failure fails boot (architecture §7). */
  async onModuleInit(): Promise<void> {
    try {
      await this.users.init();
    } catch {
      // The driver message names the duplicate key value (an email); boot output must not (architecture §10).
      throw new Error(
        'The users email unique index could not be built (duplicate or conflicting data).',
      );
    }
  }
}
