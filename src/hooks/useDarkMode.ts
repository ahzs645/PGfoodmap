import { useTheme } from 'next-themes'
import { useCallback } from 'react'

export function useDarkMode() {
  const { resolvedTheme, setTheme } = useTheme()

  const isDark = resolvedTheme === 'dark'

  const toggleDarkMode = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark')
  }, [isDark, setTheme])

  return {
    isDark,
    toggleDarkMode
  }
}
