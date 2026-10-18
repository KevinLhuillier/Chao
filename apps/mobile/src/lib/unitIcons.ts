import type { UnitIcon } from '@chao/shared';
import {
  Bike,
  Clock,
  CloudSun,
  Hand,
  Hash,
  House,
  ShoppingBasket,
  Smile,
  Soup,
  Users,
  type LucideIcon,
} from 'lucide-react-native';

/** Icon of each unit theme (chosen in the admin). */
export const UNIT_ICON: Record<UnitIcon, LucideIcon> = {
  hello: Hand,
  family: Users,
  food: Soup,
  market: ShoppingBasket,
  numbers: Hash,
  travel: Bike,
  time: Clock,
  home: House,
  weather: CloudSun,
  feelings: Smile,
};

export const unitIcon = (icon: string): LucideIcon => UNIT_ICON[icon as UnitIcon] ?? Hand;
