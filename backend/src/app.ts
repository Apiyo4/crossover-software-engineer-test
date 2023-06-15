
import { UrlLoaderService } from './services/url-loader.service.js'
import { Command } from 'commander'

interface AppParameters {
  url: string
}

export const DEFAULT_URL = 'https://www.kayako.com/'

export class App {
  /* istanbul ignore next */
  constructor (private readonly urlLoader: UrlLoaderService, private readonly command = new Command()) {
  }

  async run (): Promise<void> {
    const appParameters = this.parseCli()

    await this.process(appParameters)
  }

  async process (appParameters: AppParameters): Promise<void> {
    const extractedText = await this.urlLoader.loadUrlTextAndLinks(appParameters.url)
    const count = (extractedText.text.toLocaleLowerCase().match(/kayako/ig) ?? []).length
    console.log(`Found ${count} instances of 'kayako' in the body of the page`)
  }

  parseCli (argv: readonly string[] = process.argv): AppParameters {
    this.command
      .requiredOption('-u, --url <url>', 'URL to load', DEFAULT_URL)

    this.command.parse(argv)
    const options = this.command.opts()

    return { url: options.url }
  }
}
