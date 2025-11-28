import { useTheme as useNextTheme } from 'next-themes'

export const useTheme = () => {
  const { theme, setTheme, themes } = useNextTheme()
  
  return {
    theme,
    setTheme,
    themes,
    isLight: theme === 'light',
    isDark: theme === 'dark'
  }
}