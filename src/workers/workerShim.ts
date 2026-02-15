/// <reference lib="webworker" />

const workerGlobal = self as unknown as { global?: unknown; window?: unknown };
workerGlobal.global = self;
workerGlobal.window = self;

if (import.meta.env.DEV) {
  (workerGlobal.window as { $RefreshReg$?: () => void }).$RefreshReg$ = () => {};
  (workerGlobal.window as { $RefreshSig$?: () => (type: unknown) => unknown }).$RefreshSig$ = () => (type) => type;
  (workerGlobal.window as { __vite_plugin_react_preamble_installed__?: boolean }).__vite_plugin_react_preamble_installed__ = true;
}
