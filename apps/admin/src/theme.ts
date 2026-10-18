/**
 * Same design tokens as the mobile app: the palette is imported from
 * apps/mobile/src/theme and exposed as CSS variables (--primary, --text-muted,
 * --unit-jade-solid…), so a color change there applies here too.
 */
import type { UnitColor } from '@chao/shared';
import { colors, unitColors } from '@mobile-theme/colors';
import { depth, radii, spacing } from '@mobile-theme/spacing';
import type { CSSProperties } from 'react';

export { colors, unitColors };

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

export function applyTheme(root = document.documentElement) {
  const set = (name: string, value: string | number) =>
    root.style.setProperty(`--${name}`, typeof value === 'number' ? `${value}px` : value);

  for (const [name, value] of Object.entries(colors)) set(kebab(name), value);
  for (const [name, value] of Object.entries(spacing)) set(`space-${name}`, value);
  for (const [name, value] of Object.entries(radii)) set(`radius-${name}`, value);
  set('depth-button', depth.button);
  set('depth-card', depth.card);
}

/** CSS variables of a unit color, for inline styles: `style={unitVars('jade')}`. */
export function unitVars(color: UnitColor | string) {
  const c = unitColors[color as UnitColor] ?? unitColors.jade;
  return { '--unit': c.solid, '--unit-shade': c.shade, '--unit-soft': c.soft } as CSSProperties;
}
