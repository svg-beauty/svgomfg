import FloatingActionButton from './floating-action-button.js'
import Spinner from './spinner.js'

export default class DownloadButton extends FloatingActionButton {
  constructor() {
    const title = 'Download'

    super({
      title,
      href: './',
      iconSvg:
        // prettier-ignore
        '<svg aria-hiddem="true" class="icon" viewBox="0 0 24 24">' +
          '<path d="M5 20h14q.425 0 .713.288T20 21q0 .425-.288.713T19 22H5q-.425 0-.712-.288T4 21q0-.425.288-.712T5 20Zm7-2.625q-.225 0-.437-.1t-.363-.3l-4.95-6.35q-.375-.5-.1-1.062T7.05 9H9V3q0-.425.288-.712T10 2h4q.425 0 .713.288T15 3v6h1.95q.625 0 .9.563t-.1 1.062l-4.95 6.35q-.15.2-.363.3t-.437.1Z"/>' +
        '</svg>',
      major: true,
    })

    this._spinner = new Spinner()
    this.container.append(this._spinner.container)
  }

  setDownload(filename, { url }) {
    this.container.download = filename
    this.container.href = url
  }

  working() {
    this._spinner.show(500)
  }

  done() {
    this._spinner.hide()
  }
}
