/// <reference types="vite/client" />
/// <reference types="node" />

interface Window {
  grecaptcha?: {
    ready(cb: () => void): void;
    execute(siteKey: string, opts: { action: string }): Promise<string>;
  };
}
