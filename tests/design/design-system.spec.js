import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const surface of ['customer', 'admin', 'components']) {
  for (const width of [1440, 960, 640, 390, 320]) {
    test(`${surface} is accessible and fits ${width}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({
        width,
        height: width === 1440 ? 1100 : 844,
      });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(`/design/${surface}`);
      await page.evaluate(() => document.fonts.ready);
      for (const img of await page.locator('img').all()) {
        await img.scrollIntoViewIfNeeded();
        await expect
          .poll(() =>
            img.evaluate(
              (element) => element.complete && element.naturalWidth > 0,
            ),
          )
          .toBeTruthy();
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBeTruthy();
      const accessibility = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(accessibility.violations).toEqual([]);
      expect(errors).toEqual([]);
      await page.screenshot({
        path: testInfo.outputPath(`${surface}-${width}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    });
  }
}

test('guest search preserves URL state and browser history', async ({
  page,
}) => {
  await page.goto('/design/customer');
  await page.getByLabel('Where to?').click();
  await page.getByRole('option', { name: 'Savannah' }).click();
  await page.getByRole('button', { name: 'Find rooms' }).click();
  await expect(page).toHaveURL(/city=Savannah/);
  await expect(
    page.getByRole('heading', { name: 'The Forsyth' }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Where to?')).toHaveText('Savannah');
  await page.getByLabel('Where to?').click();
  await page.getByRole('option', { name: 'Newport' }).click();
  await page.getByRole('button', { name: 'Find rooms' }).click();
  await expect(
    page.getByRole('heading', { name: 'A different stay is waiting.' }),
  ).toBeVisible();
  await page.goBack();
  await expect(page.getByLabel('Where to?')).toHaveText('Savannah');
});

test('custom select supports keyboard selection', async ({
  page,
}, testInfo) => {
  await page.goto('/design/customer');
  const guests = page.getByLabel('Guests', { exact: true }).first();
  await guests.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('custom-select-open.png'),
    animations: 'disabled',
  });
  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(guests).toHaveText('3 guests');
});

test('search controls share one baseline and height', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/design/customer');
  const controls = [
    page.getByLabel('Where to?'),
    page.getByLabel('Check-in', { exact: true }),
    page.getByLabel('Check-out', { exact: true }),
    page.getByLabel('Guests', { exact: true }).first(),
    page.getByRole('button', { name: 'Find rooms' }),
  ];
  const boxes = await Promise.all(
    controls.map((control) => control.boundingBox()),
  );
  expect(new Set(boxes.map((box) => Math.round(box.y))).size).toBe(1);
  expect(new Set(boxes.map((box) => Math.round(box.height)))).toEqual(
    new Set([52]),
  );
});

test('search controls accommodate 200 percent text scaling', async ({
  page,
}) => {
  await page.setViewportSize({ width: 960, height: 900 });
  await page.goto('/design/customer');
  await page.evaluate(() => {
    document.body.style.fontSize = '32px';
  });
  const controls = [
    page.getByLabel('Where to?'),
    page.getByLabel('Check-in', { exact: true }),
    page.getByLabel('Check-out', { exact: true }),
    page.getByLabel('Guests', { exact: true }).first(),
    page.getByRole('button', { name: 'Find rooms' }),
  ];
  for (const control of controls) {
    expect(
      await control.evaluate(
        (element) => element.scrollHeight <= element.clientHeight,
      ),
    ).toBeTruthy();
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});

test('document exposes the Stillwater favicon', async ({ page, request }) => {
  await page.goto('/design/customer');
  const favicon = page.locator('link[rel="icon"]');
  await expect(favicon).toHaveAttribute('href', '/favicon.svg');
  const response = await request.get('/favicon.svg');
  expect(response.ok()).toBeTruthy();
  expect(await response.text()).toContain('<title>Stillwater Hotels</title>');
});

test('cookie choice closes and can be reopened from the footer', async ({
  page,
}) => {
  await page.goto('/design/customer');
  const heading = page.getByRole('heading', { name: 'Your privacy choices' });
  await expect(heading).toBeVisible();
  await page.getByRole('button', { name: 'Use essential only' }).click();
  await expect(heading).not.toBeVisible();
  await page.getByRole('button', { name: 'Cookie preferences' }).click();
  await expect(heading).toBeVisible();
  await page.getByRole('button', { name: 'Use essential only' }).click();
  await page.getByRole('button', { name: 'Privacy', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'Privacy notice' }),
  ).toBeVisible();
});

test('invalid dates have a visible error and move keyboard focus', async ({
  page,
}) => {
  await page.goto('/design/customer');
  const checkIn = await page
    .getByLabel('Check-in', { exact: true })
    .inputValue();
  await page.getByLabel('Check-out', { exact: true }).fill(checkIn);
  await page.getByRole('button', { name: 'Find rooms' }).click();
  await expect(page.getByText('Choose a date after check-in.')).toBeVisible();
  await expect(page.getByLabel('Check-out', { exact: true })).toBeFocused();
});

test('room dialog traps focus and restores it on Escape', async ({
  page,
}, testInfo) => {
  await page.goto('/design/customer');
  const trigger = page.getByRole('button', { name: 'View rooms' }).first();
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', {
    name: 'Rooms at The Battery',
  });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole('button', { name: 'Reserve room' }),
  ).toBeDisabled();
  await page.screenshot({
    path: testInfo.outputPath('room-dialog.png'),
    animations: 'disabled',
  });
  const intro = await dialog
    .getByText('Review the room and stay details before continuing.')
    .boundingBox();
  const staySummary = await dialog
    .locator('dl[aria-label="Your stay"]')
    .boundingBox();
  expect(
    Math.round(staySummary.y - (intro.y + intro.height)),
  ).toBeGreaterThanOrEqual(20);
  for (let count = 0; count < 4; count++) {
    await page.keyboard.press('Tab');
    expect(
      await dialog.evaluate((element) =>
        element.contains(document.activeElement),
      ),
    ).toBeTruthy();
  }
  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test('admin cancellation requires a second action and remains local', async ({
  page,
}) => {
  const mutations = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method()))
      mutations.push(request.url());
  });
  await page.goto('/design/admin');
  await page.getByRole('button', { name: 'View reservation SW-1048' }).click();
  await page
    .getByRole('button', { name: 'Cancel reservation', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toHaveAccessibleName(
    'Cancel this sample reservation?',
  );
  await page.getByRole('button', { name: 'Keep reservation' }).click();
  await expect(page.getByRole('dialog').getByText('Confirmed')).toBeVisible();
  await page
    .getByRole('button', { name: 'Cancel reservation', exact: true })
    .click();
  await page.getByRole('button', { name: 'Confirm cancellation' }).click();
  await expect(
    page.getByRole('row', { name: /Olivia Martin/ }).getByText('Cancelled'),
  ).toBeVisible();
  expect(mutations).toEqual([]);
  await page.reload();
  await expect(
    page.getByRole('row', { name: /Olivia Martin/ }).getByText('Confirmed'),
  ).toBeVisible();
});

test('narrow admin table remains keyboard reachable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/design/admin');
  const table = page.getByRole('region', { name: 'Reservation records' });
  await table.focus();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('button', { name: 'View reservation SW-1048' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('reduced-motion preference stops the decorative loading animation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/design/components');
  const spinner = page
    .getByRole('button', { name: 'Saving changes' })
    .locator('svg');
  await expect(spinner).toHaveCSS('animation-name', 'none');
});

test('sample administrator is unavailable in the production build', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:4175/design/admin');
  await expect(
    page.getByRole('heading', { name: 'Page not found' }),
  ).toBeVisible();
  await expect(page.getByText('Olivia Martin')).toHaveCount(0);
});
