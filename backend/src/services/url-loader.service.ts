import puppeteer, { Browser } from 'puppeteer'

import { domExtractHyperlinks, domExtractText, pageEval } from './page-eval.service.js'

export interface TextAndLinks{
  text: string
  links: string[]
}

export class UrlLoaderService {
  private static instance: UrlLoaderService

  static async getInstance (): Promise<UrlLoaderService> {
    if (UrlLoaderService.instance === undefined) {
      const browser = await puppeteer.launch()
      UrlLoaderService.instance = new UrlLoaderService(browser)
    }
    return UrlLoaderService.instance
  }

  private constructor (private readonly browser: Browser) {
  }

  async getLoadUrlTextAndLinks (url: string): Promise<TextAndLinks> {
    const page = await this.browser.newPage()
    await page.setDefaultNavigationTimeout(600000)
    await page.goto(url)
    await page.waitForSelector('body')
    const [text, links] = await Promise.all([await pageEval(page, domExtractText), await pageEval(page, domExtractHyperlinks)])

    return { text, links }
  }

  async loadUrlTextAndLinks (url: string, depth?: number): Promise<TextAndLinks> {
    const newDepth = typeof depth === 'undefined' ? 2 : depth
    const visited = new Set<string>()
    const queue: Array<{ url: string, level: number }> = [{ url, level: 0 }]
    const result: TextAndLinks = { text: '', links: [] }
    while (queue.length > 0) {
      const currentBatch = queue.splice(0, queue.length)
      const promises = currentBatch.map(async (current) => {
        const { url: currentUrl, level } = current
        if (visited.has(currentUrl) || level > newDepth) return

        visited.add(currentUrl)

        const pageResult = await this.getLoadUrlTextAndLinks(currentUrl)
        result.text += pageResult.text
        const filteredPageResultLinks = [...new Set(pageResult.links.filter((link) => {
          return !result.links.includes(link) && !result.links.includes(link + '/') && !visited.has(link) && !visited.has(link + '/') && this.isWebsiteAndHomepage(link)
        }))]
        result.links.push(...filteredPageResultLinks)

        for (const link of filteredPageResultLinks) {
          queue.push({ url: link, level: level + 1 })
        }
      })

      await Promise.all(promises)
    }
    return result
  }

  isWebsiteAndHomepage (url: string): boolean {
    const urlPattern = /^(?:(?:https?|ftp):\/\/)?(?:www\.)?kayako\.com(?:\/(?!(?:[a-z0-9\-._~:/?#[\]@!$&'()*+,;=]+\.(?:pdf|docx?|xlsx?|pptx?|jpe?g|png|gif|bmp|svg|mp4|mov|avi|mp3|wav|ogg)))(?![^#]*#)[a-z0-9\-._~:/?#[\]@!$&'()*+,;=]+){0,2}$/i

    return urlPattern.test(url)
  }
}
