import { Tabs } from 'expo-router';
import { BookOpen, CircleUserRound, Sailboat } from 'lucide-react-native';

import { t } from '@/i18n';
import { Icon, colors, fonts, haptics } from '@/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenListeners={{ tabPress: () => haptics.select() }}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.extraBold, fontSize: 12 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 2,
          borderTopColor: colors.border,
          height: 72,
          paddingTop: 6,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.journey,
          tabBarIcon: ({ color }) => <Icon icon={Sailboat} size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="words"
        options={{
          title: t.tabs.words,
          tabBarIcon: ({ color }) => <Icon icon={BookOpen} size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.tabs.profile,
          tabBarIcon: ({ color }) => <Icon icon={CircleUserRound} size={26} color={color} />,
        }}
      />
    </Tabs>
  );
}
