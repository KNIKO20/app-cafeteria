// theme.ts — Fuente única de verdad para colores y estilos compartidos
// Importa desde aquí en todas las pantallas para coherencia visual.

export const C = {
  dark:   '#1A3329',          // Verde bosque profundo — fondos oscuros, headers
  mid:    '#00704A',          // Verde principal — acciones primarias, iconos activos
  accent: '#CBA258',          // Oro — badges, detalles de énfasis
  light:  '#D4E9E2',          // Verde muy claro — fondos de chips seleccionados
  white:  '#FFFFFF',
  bg:     '#F7F4EF',          // Blanco cálido — fondo de todas las pantallas
  muted:  '#8BA99A',          // Verde grisáceo — texto secundario
  subtle: '#E8F0EC',          // Verde sutilísimo — separadores, fondos de cards
  border: 'rgba(26,51,41,0.08)',  // Borde suave sobre fondos claros
  borderDark: 'rgba(255,255,255,0.08)', // Borde suave sobre fondos oscuros

  // Estados semánticos — usados en badges y alertas
  success: '#2D6A4F',
  successBg: '#D8F3DC',
  warning: '#946200',
  warningBg: '#FFF1CC',
  danger: '#9B2335',
  dangerBg: '#FDDEDE',
  info: '#1D5F8A',
  infoBg: '#D6EAF8',
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const shadow = {
  card: {
    shadowColor: '#1A3329',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  elevated: {
    shadowColor: '#1A3329',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
};
