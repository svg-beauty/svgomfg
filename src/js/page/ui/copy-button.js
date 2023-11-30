import FloatingActionButton from './floating-action-button.js'

export default class CopyButton extends FloatingActionButton {
  constructor() {
    const title = 'Copy Source Code to Clipboard'

    super({
      title,
      iconSvg:
        // prettier-ignore
        '<svg aria-hidden="true" class="icon" viewBox="0 0 24 24">' +
          '<path d="M9 18q-.825 0-1.412-.587T7 16V4q0-.825.588-1.412T9 2h9q.825 0 1.413.588T20 4v12q0 .825-.587 1.413T18 18H9Zm0-2h9V4H9v12Zm-4 6q-.825 0-1.412-.587T3 20V7q0-.425.288-.712T4 6q.425 0 .713.288T5 7v13h10q.425 0 .713.288T16 21q0 .425-.288.713T15 22H5Zm4-6V4v12Z"/>' +
        '</svg>',
    })

    this._text = null
    this._pre = document.createElement('pre')
  }

  onClick(event) {
    super.onClick(event)
    this.copyText()
  }

  copyText() {
    if (!this._text) return false

    this._pre.textContent = this._text
    document.body.append(this._pre)
    getSelection().removeAllRanges()

    const range = document.createRange()
    range.selectNode(this._pre)

    window.getSelection().addRange(range)

    document.execCommand('copy')
    getSelection().removeAllRanges()
    this._pre.remove()

    return true
  }

  setCopyText(text) {
    this._text = text
  }
}
