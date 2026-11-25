import type { ReactElement, ReactNode } from "react"
import { fireEvent, render, screen, type RenderOptions } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"

import { DEFAULT_LOCALE, DEFAULT_TIME_ZONE, messages, type Locale } from "@workspace/i18n"

interface IntlProviderProps {
  children: ReactNode
  locale?: Locale
}

/** 组件测试只需 next-intl 上下文；LocaleProvider 的存储与 DOM 行为单独测试。 */
function IntlTestProvider({ children, locale = DEFAULT_LOCALE }: IntlProviderProps) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages[locale]}
      timeZone={DEFAULT_TIME_ZONE}
    >
      {children}
    </NextIntlClientProvider>
  )
}

function renderWithIntl(ui: ReactElement, options: RenderOptions & { locale?: Locale } = {}) {
  const { locale, ...renderOptions } = options

  return render(ui, {
    wrapper: ({ children }) => <IntlTestProvider locale={locale}>{children}</IntlTestProvider>,
    ...renderOptions,
  })
}

export { IntlTestProvider, renderWithIntl }

/** 打开语言下拉并选择指定语言；触发按钮的可读名称随当前语言变化。 */
async function chooseLocale(name: string) {
  const trigger = screen.getByRole("button", { name: /切换语言|Switch language/ })
  fireEvent.pointerDown(trigger, { button: 0, pointerType: "mouse" })
  const item = await screen.findByRole("menuitemradio", { name })
  fireEvent.click(item)
}

export { chooseLocale }
