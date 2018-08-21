const puppeteer = require("puppeteer")

const captureScreenshot = async () => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  await page.setViewport({ width: 720, height: 480 })
  await page.goto("http://localhost:3000")
  await page.screenshot({ path: "./docs/screenshot.png", fullPage: true })

  await browser.close()
}

captureScreenshot()
