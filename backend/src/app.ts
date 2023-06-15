
import { UrlLoaderService } from './services/url-loader.service.js'
import { Command } from 'commander'

interface AppParameters {
  url: string
  depth?: number
}

export const DEFAULT_URL = 'https://www.kayako.com/'
export const DEFAULT_DEPTH = '2'

export class App {
  /* istanbul ignore next */
  constructor (private readonly urlLoader: UrlLoaderService, private readonly command = new Command()) {
  }

  async run (): Promise<void> {
    const appParameters = this.parseCli()

    await this.process(appParameters)
  }

  async process (appParameters: AppParameters): Promise<void> {
    const extractedText = await this.urlLoader.loadUrlTextAndLinks(appParameters.url, appParameters.depth)
    const count = typeof extractedText.text === 'string' && extractedText.text.length > 1 ? (extractedText.text.toLocaleLowerCase().match(/kayako/ig) ?? []).length : 0
    console.log(`Found ${count} instances of 'kayako' in the body of the page`)
  }

  parseCli (argv: readonly string[] = process.argv): AppParameters {
    this.command
      .requiredOption('-u, --url <url>', 'URL to load', DEFAULT_URL)
      .option('-d, --depth [depth]', 'Depth of crawling', DEFAULT_DEPTH)

    this.command.parse(argv)
    const options = this.command.opts()
    const depth = typeof options.depth === 'string' ? parseInt(options.depth, 10) : parseInt(DEFAULT_DEPTH, 10)

    return { url: options.url, depth }
  }
}
