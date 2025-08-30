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
    render(
      container: string | HTMLElement,
      opts: { sitekey: string; callback: (token: string) => void }
    ): number
    reset(id?: number): void
    execute?(siteKey: string, opts: { action: string }): Promise<string>
  }
}
