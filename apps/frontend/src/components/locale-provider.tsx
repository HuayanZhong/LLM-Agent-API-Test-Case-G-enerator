"use client"

import * as React from "react"
import { NextIntlClientProvider } from "next-intl"
import { usePathname } from "next/navigation"

import {
  DEFAULT_LOCALE,
  DEFAULT_TIME_ZONE,
  LOCALE_STORAGE_KEY,
  messages,
  resolveLocale,
  type Locale,
} from "@workspace/i18n"

// 同一窗口写 localStorage 不会触发 storage 事件，用自定义事件补齐广播。
const LOCALE_CHANGE_EVENT = "interface-test-agent:locale-change"

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LocaleContext = React.createContext<LocaleContextValue | null>(null)

/**
 * 语言切换需要同时改 Provider 与持久化，所以单独暴露 setter；
 * 读当前语言仍优先用 next-intl 的 useLocale，避免两套来源。
 */
function useLocalePreference() {
  const context = React.useContext(LocaleContext)
  if (!context) {
    throw new Error("useLocalePreference must be used within LocaleProvider")
  }
  return context
}

function subscribeToLocale(onChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === LOCALE_STORAGE_KEY) onChange()
  }

  window.addEventListener("storage", handleStorage)
  window.addEventListener(LOCALE_CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener("storage", handleStorage)
    window.removeEventListener(LOCALE_CHANGE_EVENT, onChange)
  }
}

// 本地存储是不可信输入；快照始终经过 resolveLocale，未知值回落默认语言。
function getLocaleSnapshot(): Locale {
  return resolveLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY))
}

// 静态导出的首屏没有 localStorage，快照必须稳定为默认语言，避免 hydration mismatch。
function getServerLocaleSnapshot(): Locale {
  return DEFAULT_LOCALE
}

/** 静态导出的 metadata 只有中文；切换语言后按当前路由更新标签页与桌面窗口标题。 */
function getDocumentTitle(locale: Locale, pathname: string | null) {
  const { common, meta } = messages[locale]
  if (pathname?.startsWith("/register")) return meta.registerTitle
  if (pathname?.startsWith("/login")) return meta.loginTitle
  return common.productName
}

/** 描述同样只有构建期中文；与标题一起按路由改写，英文界面不再残留中文摘要。 */
function getDocumentDescription(locale: Locale, pathname: string | null) {
  const { meta } = messages[locale]
  if (pathname?.startsWith("/register")) return meta.registerDescription
  if (pathname?.startsWith("/login")) return meta.loginDescription
  return meta.productDescription
}

function applyDocumentLocale(locale: Locale, pathname: string | null) {
  document.documentElement.lang = locale
  document.title = getDocumentTitle(locale, pathname)

  const description = getDocumentDescription(locale, pathname)
  const meta = document.querySelector('meta[name="description"]')
  if (meta) {
    meta.setAttribute("content", description)
  }
}

/**
 * 语言上下文：服务端快照固定默认语言，挂载后由 useSyncExternalStore 对齐本地偏好。
 * 不在 effect 里 setState，避免级联渲染与首帧语言覆盖。
 */
function LocaleProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const locale = React.useSyncExternalStore(
    subscribeToLocale,
    getLocaleSnapshot,
    getServerLocaleSnapshot,
  )

  const setLocale = React.useCallback((next: Locale) => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next)
    window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT))
  }, [])

  React.useEffect(() => {
    applyDocumentLocale(locale, pathname)

    // Next 在 hydration 后会写入静态 metadata 的中文标题与描述；被覆盖时再应用一次。
    const observer = new MutationObserver(() => {
      const expectedTitle = getDocumentTitle(locale, pathname)
      const expectedDescription = getDocumentDescription(locale, pathname)
      const meta = document.querySelector('meta[name="description"]')
      if (
        document.title === expectedTitle &&
        (!meta || meta.getAttribute("content") === expectedDescription)
      ) {
        return
      }
      applyDocumentLocale(locale, pathname)
    })
    observer.observe(document.head, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [locale, pathname])

  const value = React.useMemo(() => ({ locale, setLocale }), [locale, setLocale])

  return (
    <LocaleContext.Provider value={value}>
      <NextIntlClientProvider
        locale={locale}
        messages={messages[locale]}
        timeZone={DEFAULT_TIME_ZONE}
      >
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  )
}

export { LocaleProvider, useLocalePreference }
