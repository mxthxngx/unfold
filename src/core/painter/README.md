# core/painter

The `Painter` singleton will eventually replace the `USER_PRIMITIVE_MAP` +
`customizationStyles` inline-style injection in
`components/layouts/global/editor-layout.tsx`.

## Contract

```ts
class Painter {
  /** Subscribe to the Redux store and apply CSS custom-property mutations. */
  apply(store: AppStore): void {}
}
```

Do not implement until the customization architecture is stabilised.
