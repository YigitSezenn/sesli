export const colors = {
  bg: '#07090E',
  bgElevated: '#121722',
  card: '#1A2230',
  line: 'rgba(244, 241, 234, 0.12)',
  ink: '#F7F4EF',
  muted: '#A7B0C0',
  faint: '#6E7788',
  accent: '#7DFFB3',
  onAccent: '#062214',
  sage: '#7DFFB3',
  danger: '#FF8F86',
};

export const fonts = {
  display: 'Literata_600SemiBold',
  displayItalic: 'Literata_500Medium_Italic',
  body: 'Manrope_500Medium',
  regular: 'Manrope_400Regular',
  strong: 'Manrope_700Bold',
  semibold: 'Manrope_600SemiBold',
};

export const metrics = {
  tabBar: 62,
  mini: 72,
  pad: 20,
  radius: 22,
};

const coverTints = ['#1E2A38', '#243028', '#2A2438', '#33281E', '#1E2E32', '#2C2430'];

export function coverTint(seed: string): string {
  const total = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return coverTints[total % coverTints.length];
}
