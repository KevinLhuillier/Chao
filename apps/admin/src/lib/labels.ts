import type { ActivityType, UnitColor, UnitIcon } from '@chao/shared';
import {
  BookOpen,
  Bike,
  Blocks,
  CheckSquare,
  Clock,
  CloudSun,
  Ear,
  FileText,
  Hand,
  Hash,
  Headphones,
  House,
  Keyboard,
  Languages,
  Link2,
  ListChecks,
  PenLine,
  ShoppingBasket,
  Smile,
  Soup,
  Users,
  type LucideIcon,
} from 'lucide-react';

/** French labels of the activity types (the admin is in French). */
export const ACTIVITY_LABELS: Record<
  ActivityType,
  { label: string; hint: string; icon: LucideIcon }
> = {
  learn: {
    label: 'Fiche mot',
    hint: 'Présente un mot : audio, sens, astuce, exemple.',
    icon: BookOpen,
  },
  note: {
    label: 'Fiche de cours libre',
    hint: 'Titres, textes, sons à écouter, exemples : pour l’alphabet, les tons, la grammaire…',
    icon: FileText,
  },
  choice_meaning: {
    label: 'QCM vietnamien → anglais',
    hint: '« Que veut dire… ? » : 4 propositions en anglais.',
    icon: ListChecks,
  },
  choice_vi: {
    label: 'QCM anglais → vietnamien',
    hint: '« Comment dit-on… ? » : 4 propositions en vietnamien.',
    icon: CheckSquare,
  },
  listen_choice: {
    label: 'Écoute + QCM',
    hint: 'L’audio est joué, choisir le mot entendu. Sans audio : QCM anglais → vietnamien.',
    icon: Ear,
  },
  type_meaning: {
    label: 'Écrire la traduction',
    hint: 'Taper le sens en anglais.',
    icon: Keyboard,
  },
  type_vi: {
    label: 'Écrire en vietnamien',
    hint: 'Taper le mot vietnamien (les accents manquants sont tolérés).',
    icon: PenLine,
  },
  listen_type: {
    label: 'Dictée',
    hint: 'Écouter et écrire en vietnamien. Sans audio : « Écrire en vietnamien ».',
    icon: Headphones,
  },
  match: { label: 'Relier les paires', hint: '2 à 6 mots à relier à leur sens.', icon: Link2 },
  build_vi: {
    label: 'Phrase → vietnamien',
    hint: 'Reconstituer la phrase vietnamienne avec des étiquettes.',
    icon: Blocks,
  },
  build_meaning: {
    label: 'Phrase → anglais',
    hint: 'Reconstituer la traduction anglaise avec des étiquettes.',
    icon: Languages,
  },
};

export const COLOR_LABELS: Record<UnitColor, string> = {
  jade: 'Jade (Mékong)',
  lantern: 'Rouge lanterne',
  lotus: 'Rose lotus',
  gold: 'Or étoile',
  bamboo: 'Vert bambou',
  sky: 'Bleu ciel',
};

export const ICONS: Record<UnitIcon, { label: string; icon: LucideIcon }> = {
  hello: { label: 'Salutations', icon: Hand },
  family: { label: 'Famille', icon: Users },
  food: { label: 'Nourriture', icon: Soup },
  market: { label: 'Marché', icon: ShoppingBasket },
  numbers: { label: 'Nombres', icon: Hash },
  travel: { label: 'Transports', icon: Bike },
  time: { label: 'Temps', icon: Clock },
  home: { label: 'Maison', icon: House },
  weather: { label: 'Météo', icon: CloudSun },
  feelings: { label: 'Émotions', icon: Smile },
};

export const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;
