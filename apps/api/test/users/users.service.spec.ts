import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { User } from '../../src/users/user.schema.js';
import { DuplicateEmailError } from '../../src/users/users.errors.js';
import { UsersModule } from '../../src/users/users.module.js';
import { UsersService } from '../../src/users/users.service.js';
import { createTestApp, type TestApp } from '../setup/app-factory.js';
import { clearDatabase } from '../setup/cleanup.js';

const newUser = (email = 'dana@company.com') => ({
  email,
  name: 'Dana Levi',
  passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$fake-hash-for-tests',
});

describe('UsersService (task 1.2)', () => {
  let testApp: TestApp;
  let users: UsersService;
  let model: Model<User>;

  beforeAll(async () => {
    testApp = await createTestApp();
    users = testApp.app.get(UsersService);
    model = testApp.app.get<Model<User>>(getModelToken(User.name));
  });

  afterEach(async () => {
    await clearDatabase(testApp.connection);
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  it('has a unique index on email once the module has initialised', async () => {
    const indexes = await model.collection.indexes();
    const email = indexes.find((index) => index.key.email === 1);

    expect(email?.unique).toBe(true);
  });

  it('stores email trimmed and lowercased, and name trimmed', async () => {
    const created = await users.create({
      ...newUser('  Dana@Company.COM  '),
      name: '  Dana Levi  ',
    });

    expect(created.email).toBe('dana@company.com');
    expect(created.name).toBe('Dana Levi');
  });

  it('findById omits the password hash', async () => {
    const created = await users.create(newUser());

    const found = await users.findById(created.id);

    expect(found?.email).toBe('dana@company.com');
    expect(found?.toObject()).not.toHaveProperty('passwordHash');
  });

  it('findByEmailWithHash selects the hash and matches case-insensitively', async () => {
    await users.create(newUser());

    const found = await users.findByEmailWithHash('  DANA@company.com ');

    expect(found?.passwordHash).toBe(newUser().passwordHash);
  });

  it('a duplicate email raises the typed DuplicateEmailError, without a pre-check', async () => {
    await users.create(newUser());

    await expect(users.create(newUser('DANA@company.com'))).rejects.toBeInstanceOf(
      DuplicateEmailError,
    );
    expect(await model.countDocuments()).toBe(1);
  });

  it('findById returns null for an invalid or unknown id', async () => {
    expect(await users.findById('not-an-object-id')).toBeNull();
    expect(await users.findById('6650f1c2a9e4b7d1c3a2f001')).toBeNull();
  });

  it('toPublicUser exposes only id, email, name and createdAt', async () => {
    const created = await users.create(newUser());

    const publicUser = users.toPublicUser(created);

    expect(Object.keys(publicUser).sort()).toEqual(['createdAt', 'email', 'id', 'name']);
    expect(publicUser.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('UsersModule boot (task 1.2)', () => {
  it('fails boot with a generic message when the unique index cannot be built', async () => {
    const testApp = await createTestApp();
    const model = testApp.app.get<Model<User>>(getModelToken(User.name));
    const module = testApp.app.get(UsersModule);
    const leak = 'E11000 duplicate key error dup key: { email: "zq9-dup@company.com" }';
    const original = model.init.bind(model);
    model.init = () => Promise.reject(new Error(leak));
    try {
      const failure = module.onModuleInit();

      await expect(failure).rejects.toThrow(/could not be built/);
      await expect(failure).rejects.not.toThrow(/zq9-dup@company\.com/);
    } finally {
      model.init = original;
      await testApp.app.close();
    }
  });
});
