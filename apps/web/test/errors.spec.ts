import { describe, expect, it } from 'vitest';
import { DISPLAY, networkOrServerError, toFormError } from '../src/lib/errors';

const signupFields = ['email', 'name', 'password'] as const;
const signinFields = ['email', 'password'] as const;
const requestId = '9b5e544f-f50b-47c3-8464-e5ec5acd0eca';

describe('toFormError (architecture §8 form failure UX)', () => {
  it('400: maps fieldErrors onto the form fields, first message each', () => {
    const body = {
      code: 'VALIDATION_FAILED',
      fieldErrors: {
        email: ['Enter a valid email address'],
        password: ['Password must be at least 8 characters', 'Password must contain a number'],
      },
    };

    expect(toFormError('signup', 400, body, null, signupFields)).toEqual({
      fieldErrors: {
        email: 'Enter a valid email address',
        password: 'Password must be at least 8 characters',
      },
    });
  });

  it('400: a field the form does not have goes to the alert', () => {
    const body = { fieldErrors: { role: ['Field is not allowed'] } };

    expect(toFormError('signup', 400, body, null, signupFields)).toEqual({
      fieldErrors: {},
      alert: 'Field is not allowed',
    });
  });

  it('400 without fieldErrors (unreadable body): the API message in the alert', () => {
    const body = { code: 'VALIDATION_FAILED', message: 'The request body could not be read.' };

    expect(toFormError('signin', 400, body, null, signinFields)).toEqual({
      fieldErrors: {},
      alert: 'The request body could not be read.',
    });
  });

  it('400 with nothing usable in the body: the generic alert, never silence', () => {
    expect(toFormError('signin', 400, undefined, null, signinFields)).toEqual({
      fieldErrors: {},
      alert: 'Something went wrong. Try again.',
    });
  });

  it('401 on signin: the generic credentials alert', () => {
    expect(toFormError('signin', 401, { code: 'INVALID_CREDENTIALS' }, null, signinFields)).toEqual(
      {
        fieldErrors: {},
        alert: 'Invalid email or password',
      },
    );
  });

  it('409 on signup: field error on email', () => {
    expect(toFormError('signup', 409, { code: 'EMAIL_TAKEN' }, null, signupFields)).toEqual({
      fieldErrors: { email: 'An account with this email already exists' },
    });
  });

  it('429: the wait message with N from Retry-After', () => {
    expect(toFormError('signin', 429, {}, '42', signinFields).alert).toBe(
      'Too many attempts. Try again in 42 seconds.',
    );
    expect(toFormError('signup', 429, {}, '1', signupFields).alert).toBe(
      'Too many attempts. Try again in 1 seconds.',
    );
  });

  it('429 without a usable Retry-After falls back to the 60 s window', () => {
    expect(toFormError('signin', 429, {}, null, signinFields).alert).toBe(DISPLAY.tooMany(60));
    expect(toFormError('signin', 429, {}, 'soon', signinFields).alert).toBe(DISPLAY.tooMany(60));
  });

  it.each([500, 503])('%i: the generic alert plus the request reference', (status) => {
    expect(toFormError('signin', status, { requestId }, null, signinFields)).toEqual({
      fieldErrors: {},
      alert: 'Something went wrong. Try again.',
      reference: `Reference: ${requestId}`,
    });
  });

  it("5xx without a JSON body (the proxy's plain-text 500): generic, no reference", () => {
    expect(toFormError('signup', 500, undefined, null, signupFields)).toEqual({
      fieldErrors: {},
      alert: 'Something went wrong. Try again.',
    });
  });

  it('network failure: the generic alert without a reference', () => {
    expect(networkOrServerError()).toEqual({
      fieldErrors: {},
      alert: 'Something went wrong. Try again.',
    });
  });
});
