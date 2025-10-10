export const Colors = {
  primary: '#4CAF50', // Um verde mais tecnológico
  primaryLight: '#81C784',
  primaryDark: '#388E3C',
  accent: '#FFC107',
  background: '#121212', // Tema escuro
  surface: '#1E1E1E',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textTertiary: '#808080',
  error: '#CF6679',
  success: '#66BB6A',
  warning: '#FFD54F',
  info: '#42A5F5',
  divider: '#303030',
  card: '#2A2A2A',
  buttonPrimary: '#4CAF50',
  buttonSecondary: '#303030',
  buttonText: '#FFFFFF',
  inputBackground: '#2A2A2A',
  inputText: '#FFFFFF',
  placeholder: '#808080',
  icon: '#FFFFFF',
  iconActive: '#4CAF50',
  gradientStart: '#4CAF50',
  gradientEnd: '#388E3C',
  shadow: 'rgba(0, 0, 0, 0.8)', // Adicionado para resolver o erro 'shadow' não existe
};

export const Typography = {
  fontFamily: 'System',
  h1: {
    fontSize: 32,
    fontWeight: '700' as '700',
    color: Colors.textPrimary,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700' as '700',
    color: Colors.textPrimary,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as '600',
    color: Colors.textPrimary,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as '600',
    color: Colors.textPrimary,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as '400',
    color: Colors.textPrimary,
  },
  small: {
    fontSize: 14,
    fontWeight: '400' as '400',
    color: Colors.textSecondary,
  },
  bodyLarge: {
    fontSize: 18,
    fontWeight: '400' as '400',
    color: Colors.textPrimary,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '400' as '400',
    color: Colors.textPrimary,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as '400',
    color: Colors.textSecondary,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as '600',
    color: Colors.buttonText,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as '400',
    color: Colors.textTertiary,
  },
};

export const DarkTheme = {
  dark: true,
  colors: {
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.card,
    text: Colors.textPrimary,
    border: Colors.divider,
    notification: Colors.accent,
  },
};


