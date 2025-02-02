import FloatingActionButton from './floating-action-button.js'

export default class BgFillButton extends FloatingActionButton {
  constructor() {
    const title = 'Preview on vivid background'

    super({
      title,
      iconSvg:
        // prettier-ignore
        '<svg aria-hidden="true" class="icon" viewBox="0 0 24 24">' +
          '<path d="M12 21q-3.775 0-6.387-2.613T3 12q0-3.45 2.25-5.988T11 3.05q.325-.05.575.088t.4.362q.15.225.163.525t-.188.575q-.425.65-.638 1.375T11.1 7.5q0 2.25 1.575 3.825T16.5 12.9q.775 0 1.538-.225t1.362-.625q.275-.175.563-.162t.512.137q.25.125.388.375t.087.6q-.35 3.45-2.937 5.725T12 21Z"/>' +
        '</svg>',
    })
  }

  onClick(event) {
    super.onClick(event)

    if (this.container.classList.contains('active')) {
      this.container.classList.remove('active')
      document.documentElement.classList.remove('bg-dark')
    } else {
      this.container.classList.add('active')
      document.documentElement.classList.add('bg-dark')
    }
  }
}
