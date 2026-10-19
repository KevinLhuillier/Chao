import { LANG_NAMES, LANGS } from '@chao/shared';
import { useFocusEffect } from 'expo-router';
import { Flame, Globe, LogOut, Target, Trophy, Zap, type LucideIcon } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmSheet } from '@/components/ConfirmSheet';
import { LANG, availableLangs, t } from '@/i18n';
import { fetchProfile } from '@/lib/api/profile';
import { useAuth } from '@/lib/auth';
import { DAILY_GOAL_OPTIONS, displayedStreak } from '@/lib/gamification';
import { useStats } from '@/lib/stats';
import { supabase } from '@/lib/supabase';
import type { Profile as ProfileRow } from '@/lib/types';
import { Badge, Button, Card, Icon, Text, borderWidth, colors, radii, spacing } from '@/theme';

export default function Profile() {
  const { session } = useAuth();
  const { stats, updateDailyGoal } = useStats();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [confirmOut, setConfirmOut] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchProfile().then(setProfile, console.warn);
    }, []),
  );

  const name = profile?.username ?? '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text variant="title" color={colors.textOnColor}>
              {name.slice(0, 1).toUpperCase() || '·'}
            </Text>
          </View>
          <View style={styles.flex}>
            <Text variant="title" numberOfLines={1}>
              {name || t.profile.title}
            </Text>
            <Text color={colors.textSecondary} numberOfLines={1}>
              {session?.user.email}
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          <Stat
            icon={Zap}
            value={stats?.total_xp ?? 0}
            label={t.profile.totalXp}
            color={colors.xpShade}
          />
          <Stat
            icon={Flame}
            value={stats ? displayedStreak(stats) : 0}
            label={t.profile.streak}
            color={colors.streakShade}
          />
          <Stat
            icon={Trophy}
            value={stats?.best_streak ?? 0}
            label={t.profile.bestStreak}
            color={colors.primary}
          />
        </View>

        <Card>
          <View style={styles.titleRow}>
            <Icon icon={Target} size={22} color={colors.xpShade} />
            <Text variant="heading">{t.profile.dailyGoal}</Text>
          </View>
          <Text color={colors.textSecondary} style={styles.hint}>
            {t.profile.dailyGoalHint}
          </Text>
          <View style={styles.goals}>
            {DAILY_GOAL_OPTIONS.map((goal) => (
              <Button
                key={goal}
                label={`${goal}`}
                variant={stats?.daily_goal_xp === goal ? 'primary' : 'secondary'}
                haptic="tap"
                style={styles.goal}
                onPress={() => updateDailyGoal(goal).catch(console.warn)}
              />
            ))}
          </View>
        </Card>

        <Card>
          <View style={styles.titleRow}>
            <Icon icon={Globe} size={22} color={colors.info} />
            <Text variant="heading">{t.profile.language}</Text>
          </View>
          <View style={styles.langs}>
            {LANGS.map((lang) => {
              const available = availableLangs.includes(lang);
              return (
                <View
                  key={lang}
                  style={[
                    styles.lang,
                    lang === LANG && styles.langActive,
                    !available && styles.langSoon,
                  ]}>
                  <Text
                    variant="bodyBold"
                    color={lang === LANG ? colors.primaryShade : colors.textSecondary}>
                    {LANG_NAMES[lang]}
                  </Text>
                </View>
              );
            })}
          </View>
          <Badge label={t.profile.languageSoon} style={styles.soon} />
        </Card>

        <Button
          label={t.profile.signOut}
          variant="secondary"
          icon={<Icon icon={LogOut} size={20} color={colors.danger} />}
          onPress={() => setConfirmOut(true)}
        />
      </ScrollView>

      <ConfirmSheet
        visible={confirmOut}
        icon={LogOut}
        title={t.profile.signOutConfirm}
        message={t.profile.signOutMessage}
        confirmLabel={t.profile.signOut}
        tone="danger"
        onCancel={() => setConfirmOut(false)}
        onConfirm={() => {
          setConfirmOut(false);
          supabase.auth.signOut();
        }}
      />
    </SafeAreaView>
  );
}

function Stat({
  icon,
  value,
  label,
  color,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <Card style={styles.stat} padding={spacing.md}>
      <Icon icon={icon} size={22} color={color} />
      <Text variant="title">{value}</Text>
      {/* Always one line: shrinks slightly on narrow screens instead of wrapping. */}
      <Text
        variant="caption"
        color={colors.textSecondary}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}>
        {label}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  grid: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  hint: { marginTop: spacing.xs, marginBottom: spacing.md },
  goals: { flexDirection: 'row', gap: spacing.sm },
  goal: { flex: 1 },
  langs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  lang: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth,
    borderColor: colors.borderShade,
  },
  langActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  langSoon: { opacity: 0.5 },
  soon: { marginTop: spacing.md },
});
