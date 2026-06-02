// Temporary fix for @types/react-dom not installing properly
// This should be removed once npm properly installs @types/react-dom

declare module 'react-dom' {
  export { createPortal } from 'react-dom/client';
  export * from 'react-dom/client';
  export * from 'react-dom/server';
}
