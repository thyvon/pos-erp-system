import { invoicePrintApi } from './api'

export function printHtmlInFrame(html: string, title: string, frameUnavailableMessage: string) {
  const frame = document.createElement('iframe')
  frame.title = title
  frame.style.position = 'fixed'
  frame.style.right = '0'
  frame.style.bottom = '0'
  frame.style.width = '0'
  frame.style.height = '0'
  frame.style.border = '0'
  frame.style.visibility = 'hidden'

  document.body.appendChild(frame)

  const cleanup = () => {
    window.setTimeout(() => frame.remove(), 1_000)
  }

  frame.onload = () => {
    window.setTimeout(() => {
      frame.contentWindow?.focus()
      frame.contentWindow?.print()
      cleanup()
    }, 200)
  }

  const frameDocument = frame.contentDocument

  if (!frameDocument) {
    frame.remove()
    throw new Error(frameUnavailableMessage)
  }

  frameDocument.open()
  frameDocument.write(html)
  frameDocument.close()
}

export async function printInvoice(saleId: string, title: string, frameUnavailableMessage: string, template?: string) {
  const html = await invoicePrintApi.previewHtml(saleId, template)

  printHtmlInFrame(html, title, frameUnavailableMessage)
}
