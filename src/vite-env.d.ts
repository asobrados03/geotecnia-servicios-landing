/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RECAPTCHA_SITE_KEY?: string
  readonly NEXT_PUBLIC_RECAPTCHA_SITE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  grecaptcha?: {
    ready(cb: () => void): void
    execute(siteKey: string, opts: { action: string }): Promise<string>
  }
}
