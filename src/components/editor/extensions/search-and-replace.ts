import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface SearchAndReplaceOptions {
  searchResultClass: string;
  searchResultCurrentClass: string;
  caseSensitive: boolean;
  disableRegex: boolean;
}

export interface SearchAndReplaceStorage {
  searchTerm: string;
  replaceTerm: string;
  results: Array<{ from: number; to: number }>;
  resultIndex: number;
  caseSensitive: boolean;
}

export const searchAndReplacePluginKey = new PluginKey('searchAndReplace');

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    searchAndReplace: {
      /**
       * Set the search term
       */
      setSearchTerm: (searchTerm: string) => ReturnType;
      /**
       * Set the replace term
       */
      setReplaceTerm: (replaceTerm: string) => ReturnType;
      /**
       * Reset the search index
       */
      resetIndex: () => ReturnType;
      /**
       * Go to next search result
       */
      nextSearchResult: () => ReturnType;
      /**
       * Go to previous search result
       */
      previousSearchResult: () => ReturnType;
      /**
       * Replace current search result
       */
      replace: () => ReturnType;
      /**
       * Replace all search results
       */
      replaceAll: () => ReturnType;
      /**
       * Set case sensitivity
       */
      setCaseSensitive: (caseSensitive: boolean) => ReturnType;
      /**
       * Select current item
       */
      selectCurrentItem: () => ReturnType;
    };
  }
}

function searchDocument(doc: any, searchTerm: string, caseSensitive: boolean) {
  const results: Array<{ from: number; to: number }> = [];
  
  if (!searchTerm) {
    return results;
  }

  const searchText = caseSensitive ? searchTerm : searchTerm.toLowerCase();

  doc.descendants((node: any, pos: number) => {
    if (node.isText) {
      const nodeText = caseSensitive ? node.text : node.text.toLowerCase();
      let index = 0;

      while (index < nodeText.length) {
        const foundIndex = nodeText.indexOf(searchText, index);
        if (foundIndex === -1) break;

        results.push({
          from: pos + foundIndex,
          to: pos + foundIndex + searchTerm.length,
        });

        index = foundIndex + 1;
      }
    }
  });

  return results;
}

export const SearchAndReplace = Extension.create<SearchAndReplaceOptions, SearchAndReplaceStorage>({
  name: 'searchAndReplace',

  addOptions() {
    return {
      searchResultClass: 'search-result',
      searchResultCurrentClass: 'search-result-current',
      caseSensitive: false,
      disableRegex: true,
    };
  },

  addStorage() {
    return {
      searchTerm: '',
      replaceTerm: '',
      results: [],
      resultIndex: 0,
      caseSensitive: false,
    };
  },

  addCommands() {
    return {
      setSearchTerm:
        (searchTerm: string) =>
        ({ state, dispatch }) => {
          this.storage.searchTerm = searchTerm;
          this.storage.results = searchDocument(
            state.doc,
            searchTerm,
            this.storage.caseSensitive
          );
          this.storage.resultIndex = 0;

          if (dispatch) {
            // Trigger a state update to refresh decorations
            dispatch(state.tr);
          }

          return true;
        },

      setReplaceTerm:
        (replaceTerm: string) =>
        ({ state, dispatch }) => {
          this.storage.replaceTerm = replaceTerm;

          if (dispatch) {
            dispatch(state.tr);
          }

          return true;
        },

      resetIndex:
        () =>
        ({ state, dispatch }) => {
          this.storage.resultIndex = 0;

          if (dispatch) {
            dispatch(state.tr);
          }

          return true;
        },

      nextSearchResult:
        () =>
        ({ state, dispatch }) => {
          const { results, resultIndex } = this.storage;

          if (results.length === 0) {
            return false;
          }

          this.storage.resultIndex = (resultIndex + 1) % results.length;

          if (dispatch) {
            dispatch(state.tr);
          }

          return true;
        },

      previousSearchResult:
        () =>
        ({ state, dispatch }) => {
          const { results, resultIndex } = this.storage;

          if (results.length === 0) {
            return false;
          }

          this.storage.resultIndex = resultIndex === 0 ? results.length - 1 : resultIndex - 1;

          if (dispatch) {
            dispatch(state.tr);
          }

          return true;
        },

      replace:
        () =>
        ({ state, dispatch, editor }) => {
          const { results, resultIndex, replaceTerm } = this.storage;

          if (results.length === 0) {
            return false;
          }

          const result = results[resultIndex];
          if (!result) {
            return false;
          }

          if (dispatch) {
            const tr = state.tr.insertText(replaceTerm, result.from, result.to);
            dispatch(tr);

            // Update results after replacement
            setTimeout(() => {
              editor.commands.setSearchTerm(this.storage.searchTerm);
            }, 0);
          }

          return true;
        },

      replaceAll:
        () =>
        ({ state, dispatch, editor }) => {
          const { results, replaceTerm } = this.storage;

          if (results.length === 0) {
            return false;
          }

          if (dispatch) {
            let tr = state.tr;

            // Replace in reverse order to maintain positions
            for (let i = results.length - 1; i >= 0; i--) {
              const result = results[i];
              tr = tr.insertText(replaceTerm, result.from, result.to);
            }

            dispatch(tr);

            // Clear search after replacing all
            setTimeout(() => {
              this.storage.results = [];
              this.storage.resultIndex = 0;
              editor.commands.setSearchTerm('');
            }, 0);
          }

          return true;
        },

      setCaseSensitive:
        (caseSensitive: boolean) =>
        ({ state, dispatch }) => {
          this.storage.caseSensitive = caseSensitive;

          // Re-search with new case sensitivity
          if (this.storage.searchTerm) {
            this.storage.results = searchDocument(
              state.doc,
              this.storage.searchTerm,
              caseSensitive
            );
            this.storage.resultIndex = 0;
          }

          if (dispatch) {
            dispatch(state.tr);
          }

          return true;
        },

      selectCurrentItem:
        () =>
        ({ state, dispatch }) => {
          const { results, resultIndex } = this.storage;

          if (results.length === 0) {
            return false;
          }

          const result = results[resultIndex];
          if (!result) {
            return false;
          }

          if (dispatch) {
            const tr = state.tr.setSelection(
              // @ts-ignore
              state.selection.constructor.create(state.doc, result.from, result.to)
            );
            dispatch(tr);
          }

          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const { searchResultClass, searchResultCurrentClass } = this.options;
    const extension = this;

    return [
      new Plugin({
        key: searchAndReplacePluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr) {
            const { searchTerm, results, resultIndex } = extension.storage;

            if (!searchTerm || results.length === 0) {
              return DecorationSet.empty;
            }

            const decorations = results.map((result, index) => {
              const className = index === resultIndex ? searchResultCurrentClass : searchResultClass;
              return Decoration.inline(result.from, result.to, {
                class: className,
              });
            });

            return DecorationSet.create(tr.doc, decorations);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },

  addGlobalAttributes() {
    return [
      {
        types: [],
        attributes: {},
      },
    ];
  },

  onCreate() {
    // Initialize storage
    this.storage.searchTerm = '';
    this.storage.replaceTerm = '';
    this.storage.results = [];
    this.storage.resultIndex = 0;
    this.storage.caseSensitive = this.options.caseSensitive;
  },
});