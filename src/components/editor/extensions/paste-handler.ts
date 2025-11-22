import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'


export const PasteHandler = Extension.create({
  name: 'pasteHandler',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('pasteHandler'),
        props: {
          transformPastedHTML(html) {
            return html.replace(/<h1/g, '<h2').replace(/<\/h1>/g, '</h2>')
          },
        },
      }),
    ]
  },
})
