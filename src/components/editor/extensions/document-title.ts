import { mergeAttributes, Node } from '@tiptap/core'
import { editorClasses } from '../styles/extension-styles';
import { textblockTypeInputRule } from '@tiptap/core'

export interface DocumentTitleOptions {
    HTMLAttributes: Record<string,any>
}
export const DocumentTitle = Node.create<DocumentTitleOptions>({
    name: "title",
    content: 'inline*',

    defining: true,
    parseHTML(){
        return [{tag:'h1'}]
    },
    renderHTML({HTMLAttributes}){
        return ['h1', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { class: editorClasses.documentTitle }), 0]
    },
    addInputRules() {
        return [
            textblockTypeInputRule({
                find: /^(#{1})\s$/,
                type: this.type,
            }),
        ]
    },
  });