import { expect, type Page, test } from '@playwright/test';

/**
 * Architecture §9 e2e flows against production builds and the test database. Each test uses its own account.
 * Console errors fail the test, except the browser's own note for an HTTP error status the flow expects
 * (e.g. the 401 of a wrong password), which is not an application error.
 */

const PASSWORD = 'E2e-pass!word1';
let counter = 0;
const newEmail = () => `e2e-${String(Date.now())}-${String(counter++)}@company.com`;

function watchConsole(page: Page, allowedStatuses: number[] = []): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    const status = /status of (\d{3})/.exec(text)?.[1];
    if (status && allowedStatuses.includes(Number(status))) return;
    errors.push(text);
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

async function signUp(page: Page, email: string, name = 'E2e User'): Promise<void> {
  await page.goto('/signup');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Full name').fill(name);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL('/app');
}

test('signup lands on /app with the welcome text and the new account', async ({ page }) => {
  const errors = watchConsole(page);
  const email = newEmail();

  await signUp(page, email, 'Rania Haddad');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome to the application.');
  await expect(page.getByText('Rania Haddad').first()).toBeVisible();
  await expect(page.getByText(email).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('logout returns to /signin, and /app then redirects to /signin', async ({ page }) => {
  const errors = watchConsole(page);
  await signUp(page, newEmail());

  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL('/signin');

  await page.goto('/app');
  await expect(page).toHaveURL('/signin');
  expect(errors).toEqual([]);
});

test('signin with the created account lands on /app', async ({ page }) => {
  const errors = watchConsole(page);
  const email = newEmail();
  await signUp(page, email);
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL('/signin');

  await page.getByLabel('Email address').fill(email.toUpperCase());
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL('/app');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome to the application.');
  expect(errors).toEqual([]);
});

test('a wrong password shows the generic error and stays on /signin', async ({ page }) => {
  const errors = watchConsole(page, [401]);
  const email = newEmail();
  await signUp(page, email);
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL('/signin');

  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Wrong-pass1!');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(
    page.getByRole('alert').filter({ hasText: 'Invalid email or password' }),
  ).toBeVisible();
  await expect(page).toHaveURL('/signin');
  expect(errors).toEqual([]);
});

test('client-side validation shows the §4 messages before any request', async ({ page }) => {
  const errors = watchConsole(page);
  let posted = false;
  page.on('request', (request) => {
    if (request.url().includes('/api/auth/')) posted = true;
  });
  await page.goto('/signup');

  await page.getByLabel('Email address').fill('dana@company');
  await page.getByLabel('Full name').fill('ab');
  await page.getByLabel('Password', { exact: true }).fill('abcdefgh');
  await page.getByLabel('Password', { exact: true }).blur();

  await expect(page.getByText('Enter a valid email address')).toBeVisible();
  await expect(page.getByText('Name must be at least 3 characters')).toBeVisible();
  await expect(page.getByText('Password must contain a number')).toBeVisible();

  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByLabel('Email address')).toBeFocused();
  expect(posted).toBe(false);
  expect(errors).toEqual([]);
});

test('signed-in visits to /signin and /signup redirect to /app', async ({ page }) => {
  const errors = watchConsole(page);
  await signUp(page, newEmail());

  await page.goto('/signin');
  await expect(page).toHaveURL('/app');
  await page.goto('/signup');
  await expect(page).toHaveURL('/app');
  await page.goto('/');
  await expect(page).toHaveURL('/app');
  expect(errors).toEqual([]);
});

test('the session cookie is httpOnly and never readable by page script', async ({
  page,
  context,
}) => {
  await signUp(page, newEmail());

  const cookie = (await context.cookies()).find((c) => c.name === 'access_token');
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe('Lax');
  expect(await page.evaluate(() => document.cookie)).not.toContain('access_token');
  // CLAUDE.md: the JWT never reaches browser storage either.
  const stored = await page.evaluate(() =>
    JSON.stringify(
      [localStorage, sessionStorage].flatMap((store) => Object.values(store) as string[]),
    ),
  );
  expect(stored).not.toContain(cookie?.value ?? 'missing-cookie');
  expect(stored).not.toMatch(/eyJ[\w-]+\.[\w-]+\.[\w-]+/);
});
