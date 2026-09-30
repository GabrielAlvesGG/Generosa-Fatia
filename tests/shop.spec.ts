import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { priceCart } from '../src/app/pricing';
import { PRODUCTS, SAUCES, STORE } from '../src/app/demo-data';
import { slotsFor, deliveryAllowed } from '../src/app/scheduling';
test('promoção por pares, complementos e área atendida', () => {
  for (const [quantity, total] of [
    [1, 2500],
    [2, 4500],
    [3, 7000],
    [4, 9000],
  ])
    expect(
      priceCart(
        [{ productId: 'brigadeirao', sauce: 'Sem calda', quantity }],
        PRODUCTS,
        SAUCES,
        STORE.promotion,
      ).total,
    ).toBe(total);
  expect(
    priceCart(
      [{ productId: 'brigadeirao', sauce: 'Ninho', quantity: 2 }],
      PRODUCTS,
      SAUCES,
      STORE.promotion,
    ).total,
  ).toBe(5100);
  expect(deliveryAllowed('01000-000', 'São Paulo')).toBe(true);
  expect(deliveryAllowed('99999-999', 'São Paulo')).toBe(false);
  expect(slotsFor('2026-10-05', 0).every((s) => s.disabled)).toBe(true);
  expect(slotsFor('2026-10-06', Date.parse('2026-10-06T10:01:00-03:00'))[0].disabled).toBe(true);
});
test.beforeEach(async ({ page }) => {
  await page.goto('/');
});
test('filtros, caldas, estoque e persistência', async ({ page }) => {
  await page.getByRole('button', { name: 'Frutas', exact: true }).click();
  await expect(page.locator('.product')).toHaveCount(3);
  await page.getByRole('button', { name: 'Todos', exact: true }).click();
  await expect(page.locator('.product')).toHaveCount(8);
  await expect(
    page
      .locator('.product')
      .filter({ hasText: 'Prestígio' })
      .getByRole('button', { name: 'Adicionar' }),
  ).toBeDisabled();
  await page.locator('.product').first().getByRole('button', { name: 'Adicionar' }).click();
  await page.getByRole('radio', { name: 'Ninho' }).check();
  await page
    .locator('.detail-actions')
    .getByRole('button', { name: 'Aumentar', exact: true })
    .click();
  await page.locator('.detail-actions .primary').click();
  await expect(page.locator('.cart-panel .total')).toContainText('51,00');
  await page.reload();
  await expect(page.locator('.cart-panel .total')).toContainText('51,00');
  await page.locator('.product').first().getByRole('button', { name: 'Adicionar' }).click();
  await page.locator('.detail-actions .primary').click();
  await expect(page.locator('.cart-panel .cart-line')).toHaveCount(2);
  const plus = page.locator('.cart-panel .cart-line').first().getByLabel('Aumentar quantidade');
  for (let i = 0; i < 9; i++) await plus.click();
  await expect(plus).toBeDisabled();
  await expect(
    page.locator('.product').first().getByRole('button', { name: 'Adicionar' }),
  ).toBeDisabled();
  await page.locator('.cart-panel .cart-line').first().getByLabel('Diminuir quantidade').click();
  await expect(plus).toBeEnabled();
  await page
    .locator('.cart-panel .cart-line')
    .first()
    .getByText('Remover', { exact: true })
    .click();
  await expect(page.locator('.cart-panel .cart-line')).toHaveCount(1);
});
for (const status of ['approved', 'declined', 'pending']) {
  test('checkout ' + status, async ({ page }) => {
    await page.locator('.product').first().getByRole('button', { name: 'Adicionar' }).click();
    await page.locator('.detail-actions .primary').click();
    await page.locator('.cart-panel').getByText('Continuar pedido').click();
    const dialog = page.locator('.checkout-dialog');
    await dialog.getByText('Continuar pedido').click();
    await dialog.getByText('Continuar →', { exact: true }).click();
    await expect(dialog.getByRole('alert')).toBeVisible();
    const date = new Date();
    date.setDate(date.getDate() + 1);
    if (date.getDay() === 1) date.setDate(date.getDate() + 1);
    const day =
      date.getFullYear() +
      '-' +
      String(date.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(date.getDate()).padStart(2, '0');
    await dialog.getByLabel('Qual dia?').fill(day);
    await dialog.locator('.slots button:enabled').first().click();
    if (status === 'approved') {
      await dialog.getByLabel('Receber em casa').check();
      await dialog.getByText('Continuar →', { exact: true }).click();
      await expect(dialog.getByRole('alert')).toContainText('Preencha');
      await dialog.getByLabel('CEP *', { exact: true }).fill('99999-999');
      await dialog.getByLabel('Cidade *', { exact: true }).fill('São Paulo');
      await dialog.getByLabel('Rua *', { exact: true }).fill('Rua de Teste');
      await dialog.getByLabel('Número *', { exact: true }).fill('123');
      await dialog.getByLabel('Bairro *', { exact: true }).fill('Centro');
      await dialog.getByText('Continuar →', { exact: true }).click();
      await expect(dialog.getByRole('alert')).toContainText('CEP');
      await dialog.getByLabel('CEP *', { exact: true }).fill('01000-000');
    }
    await dialog.getByText('Continuar →', { exact: true }).click();
    await dialog.getByText('Simular pagamento', { exact: true }).click();
    await expect(dialog.getByRole('alert')).toContainText('nome');
    await dialog.getByLabel('Nome e sobrenome').fill('Cliente Teste');
    await dialog.getByLabel('Telefone com DDD').fill('11999999999');
    await dialog.getByLabel('Resultado da simulação').selectOption(status);
    if (status === 'declined') await dialog.getByLabel('Cartão', { exact: true }).check();
    if (status === 'approved')
      await expect(dialog.locator('.review .total')).toContainText('33,00');
    await dialog.getByText('Simular pagamento', { exact: true }).click();
    await expect(dialog.locator('.confirmation')).toContainText(
      status === 'approved' ? 'confirmado' : 'aguardando pagamento',
    );
    const id = await dialog.locator('.confirmation>strong').innerText();
    await dialog.getByText('Atualizar status').click();
    await expect(dialog.locator('.confirmation')).toContainText(id);
    await page.reload();
    await page.getByText('Consultar pedido', { exact: true }).click();
    await page.getByLabel('Consultar um pedido demonstrativo').fill(id);
    await page.locator('.lookup').getByRole('button', { name: 'Consultar', exact: true }).click();
    await expect(page.locator('.confirmation')).toContainText(id);
  });
}
for (const width of [320, 375, 390, 768, 1024, 1440]) {
  test('layout ' + width, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.locator('.product').last().scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
    expect(
      await page
        .locator('img')
        .evaluateAll((imgs) => imgs.every((i) => (i as HTMLImageElement).naturalWidth > 0)),
    ).toBe(true);
    await page.screenshot({ path: 'test-results/catalog-' + width + '.png', fullPage: true });
    await page.locator('.product').first().getByRole('button', { name: 'Adicionar' }).click();
    await expect(page.locator('dialog[open]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  });
}
test('acessibilidade do catálogo', async ({ page }) => {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(result.violations).toEqual([]);
});

test('checkout móvel, retirada aprovada e foco no carrinho', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.locator('.product').first().getByRole('button', { name: 'Adicionar' }).click();
  await page.getByRole('radio', { name: 'Caramelo' }).check();
  await page.locator('.detail-actions .primary').click();
  await page.locator('.mobile-bar').getByRole('button', { name: 'Ver pedido' }).click();
  await expect(page.locator('.cart-drawer')).toBeVisible();
  await page.keyboard.press('Tab');
  expect(
    await page.evaluate(() =>
      document.querySelector('.cart-drawer')!.contains(document.activeElement),
    ),
  ).toBe(true);
  await page.locator('.cart-drawer').getByText('Continuar pedido').click();
  const d = page.locator('.checkout-dialog');
  await d.getByText('Continuar pedido').click();
  const date = new Date();
  date.setDate(date.getDate() + 1);
  if (date.getDay() === 1) date.setDate(date.getDate() + 1);
  const value =
    date.getFullYear() +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0');
  await d.getByLabel('Qual dia?').fill(value);
  await d.locator('.slots button:enabled').first().click();
  await d.getByText('Continuar →', { exact: true }).click();
  await page.setViewportSize({ width: 375, height: 450 });
  await d.getByLabel('Nome e sobrenome').fill('Cliente Teste');
  await d.getByLabel('Telefone com DDD').fill('11999999999');
  await expect(page.locator('.mobile-bar')).toHaveCount(0);
  const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(a11y.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual(
    [],
  );
  await d.getByText('Simular pagamento', { exact: true }).click();
  await expect(d.locator('.confirmation')).toContainText('confirmado');
  await expect(d.locator('.review .total')).toContainText('28,00');
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
});
