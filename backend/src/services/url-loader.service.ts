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

  async loadUrlTextAndLinks (url: string): Promise<TextAndLinks> {
    const page = await this.browser.newPage()
    await page.goto(url)
    await page.waitForSelector('body')
    const [text, links] = await Promise.all([await pageEval(page, domExtractText), await pageEval(page, domExtractHyperlinks)])

    return { text, links }
  }

  async bfsLoadUrlTextAndLinks (url: string): Promise<TextAndLinks> {
    const visited = new Set<string>()
    const queue: Array<{ url: string, level: number }> = [{ url, level: 0 }]
    const result: TextAndLinks = { text: '', links: [] }

    while (queue.length > 0) {
      const current = queue.shift()
      if (current == null) break

      const { url: currentUrl, level } = current
      if (visited.has(currentUrl) || level > 2) continue

      visited.add(currentUrl)

      const pageResult = await this.loadUrlTextAndLinks(currentUrl)
      result.text += pageResult.text
      const filteredPageResultLinks = [...new Set(pageResult.links.filter((link) => {
        return !result.links.includes(link) && !visited.has(link) && this.isWebsiteAndHomepage(link)
      }))]
      result.links.push(...filteredPageResultLinks)
      console.log(result.links, level)

      for (const link of filteredPageResultLinks) {
        queue.push({ url: link, level: level + 1 })
      }
    }
    return result
  }

  isWebsiteAndHomepage (url: string): boolean {
    const urlPattern = /^(?:(?:https?|ftp):\/\/)?(?:www\.)?kayako\.com(?:\/(?!(?:[a-z0-9\-._~:/?#[\]@!$&'()*+,;=]+\.(?:pdf|docx?|xlsx?|pptx?|jpe?g|png|gif|bmp|svg|mp4|mov|avi|mp3|wav|ogg)))(?![^#]*#)[a-z0-9\-._~:/?#[\]@!$&'()*+,;=]+){0,2}$/i

    return urlPattern.test(url)
  }
}
