import { test, expect, type Page } from '@playwright/test'

async function loadGame(page: Page, full = false) {
  await page.goto('/')
  await page.evaluate(async (full) => {
    // Use the real save schema and migration path, without altering a player's save.
    const { initialState } = await import('/src/game/state.ts')
    const state = initialState()
    state.screen = 'main'; state.companyName = 'Neural Works'; state.paused = true
    state.officeLevel = full ? 4 : 1
    state.staff = Array.from({ length: full ? 24 : 6 }, (_, i) => ({
      id: `smoke-${i}`, name: `Worker ${i}`, role: ['engineer', 'researcher', 'marketer', 'lawyer', 'hardware', 'engineer'][i % 6],
      nationality: 'usa', examScore: 120, level: 1, salary: 3000, assignment: 'training',
    }))
    state.datacenters = full ? 8 : 3; state.gpuCards = full ? 300 : 48
    state.fabs = full ? 3 : 1
    state.amenities = full ? ['coffee', 'meeting', 'gym', 'cooling', 'academy'] : ['coffee']
    localStorage.setItem('neural-tycoon-save', JSON.stringify(state))
  }, full)
  await page.reload()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(page.locator('.world3d-viewport canvas')).toBeVisible()
  await page.waitForTimeout(700)
}

const room = (page: Page, name: string) => page.getByRole('navigation', { name: 'Game locations' }).getByRole('button', { name, exact: true })

test('all four 3D rooms render; camera rotates, zooms and resets', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await loadGame(page)
  const canvas = page.locator('.world3d-viewport canvas')
  const before = await canvas.screenshot()
  const rect = (await canvas.boundingBox())!
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2)
  await page.mouse.down()
  await page.mouse.move(rect.x + rect.width / 2 + 180, rect.y + rect.height / 2 + 30, { steps: 12 })
  await page.mouse.up()
  await page.waitForTimeout(800)
  expect(before.equals(await canvas.screenshot())).toBe(false)
  await page.mouse.wheel(0, -250)
  await page.getByRole('button', { name: 'Reset view' }).click()
  for (const name of ['Campus', 'Lab', 'Servers', 'Office', 'Campus', 'Office']) {
    await room(page, name).click()
    await expect(canvas).toBeVisible()
    await expect(room(page, name)).toHaveAttribute('aria-current', 'page')
    await page.waitForTimeout(150)
    await expect(page.locator('.world3d-error')).toHaveCount(0)
  }
  expect(errors).toEqual([])
})

test('raycast staff selection opens the existing management menu', async ({ page }) => {
  await loadGame(page)
  const rect = (await page.locator('.world3d-viewport canvas').boundingBox())!
  let found = false
  for (let y = 0.27; y < 0.58 && !found; y += 0.035) {
    for (let x = 0.38; x < 0.67; x += 0.025) {
      const px = rect.x + rect.width * x, py = rect.y + rect.height * y
      await page.mouse.move(px, py)
      if ((await page.locator('.world3d-bottom').innerText()).includes('Worker')) {
        await page.mouse.click(px, py)
        found = true; break
      }
    }
  }
  expect(found).toBe(true)
  await expect(page.locator('.staff-menu')).toBeVisible()
})

test('full company fits on mobile and preserves saved progress', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewportSize({ width: 390, height: 844 })
  await loadGame(page, true)
  for (const name of ['Campus', 'Lab', 'Servers', 'Office']) {
    await room(page, name).click()
    const box = (await page.locator('.world3d-viewport canvas').boundingBox())!
    expect(box.width).toBeLessThanOrEqual(390)
    expect(box.height).toBeGreaterThan(100)
    await expect(page.locator('.world3d-error')).toHaveCount(0)
  }
  await page.screenshot({ path: 'test-results/3d-mobile.png' })
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('neural-tycoon-save')!).staff.length)).toBe(24)
  expect(errors).toEqual([])
})

test('a browser without WebGL can continue playing in 2D', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (String(type).includes('webgl')) return null
      return original.call(this, type, ...args)
    } as typeof original
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'New Game', exact: true }).click()
  await page.getByPlaceholder('Enter company name...').fill('Fallback Works')
  await page.getByRole('button', { name: 'Found Company' }).click()
  await page.getByRole('button', { name: 'Continue in 2D' }).click()
  await expect(page.locator('.world3d')).toHaveCount(0)
  await expect(page.locator('.office-wrap canvas')).toBeVisible()
})

test('clicking a 3D campus building enters the matching room', async ({ page }) => {
  await loadGame(page)
  await room(page, 'Campus').click()
  const rect = (await page.locator('.world3d-viewport canvas').boundingBox())!
  let found = false
  for (let y = 0.28; y < 0.7 && !found; y += 0.045) {
    for (let x = 0.2; x < 0.53; x += 0.035) {
      const px = rect.x + rect.width * x, py = rect.y + rect.height * y
      await page.mouse.move(px, py)
      if ((await page.locator('.world3d-bottom > span').innerText()) === 'Office') {
        await page.mouse.click(px, py)
        found = true; break
      }
    }
  }
  expect(found).toBe(true)
  await expect(room(page, 'Office')).toHaveAttribute('aria-current', 'page')
})
