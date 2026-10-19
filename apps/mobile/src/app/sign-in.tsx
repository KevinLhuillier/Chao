import { AtSign, KeyRound, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/components/Logo';
import { BoatArt } from '@/components/river/Boat';
import { t } from '@/i18n';
import { USERNAME, authErrorMessage, isUsernameAvailable } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import {
  Button,
  Card,
  Text,
  TextField,
  colors,
  enter,
  haptics,
  radii,
  river,
  spacing,
} from '@/theme';

type Mode = 'signIn' | 'signUp';

/**
 * Email + password sign in, and sign up with a username. The session is kept
 * on the device and refreshed automatically: the learner stays signed in.
 */
export default function SignIn() {
  const [mode, setMode] = useState<Mode>('signUp');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const credentials = { email: email.trim(), password };
      if (mode === 'signIn') {
        const { error } = await supabase.auth.signInWithPassword(credentials);
        if (error) throw error;
      } else {
        const name = username.trim();
        if (!USERNAME.test(name)) throw new Error(t.auth.errors.usernameInvalid);
        if (!(await isUsernameAvailable(name))) throw new Error(t.auth.errors.usernameTaken);
        const { data, error } = await supabase.auth.signUp({
          ...credentials,
          options: { data: { username: name } },
        });
        if (error) throw error;
        // With "Confirm email" enabled, Supabase returns no session yet.
        if (!data.session) {
          setInfo(t.auth.checkEmail);
          setMode('signIn');
        }
      }
      // On success the auth guard in _layout switches to the app automatically.
    } catch (e) {
      haptics.error();
      setError(authErrorMessage(e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  }

  const signUp = mode === 'signUp';
  const canSubmit =
    email.includes('@') && password.length >= 6 && (!signUp || username.trim().length >= 3);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Animated.View entering={enter.up()} style={styles.hero}>
            <View style={styles.water}>
              <View style={styles.boat}>
                <BoatArt />
              </View>
            </View>
            <Logo size={44} />
            <Text align="center" color={colors.textSecondary}>
              {t.auth.tagline}
            </Text>
          </Animated.View>

          <Animated.View entering={enter.up(100)}>
            <Card padding={spacing.xl}>
              <View style={styles.form}>
                <Text variant="heading">{signUp ? t.auth.createAccount : t.auth.welcomeBack}</Text>
                {signUp ? (
                  <TextField
                    icon={AtSign}
                    placeholder={t.auth.username}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="username-new"
                    textContentType="username"
                    maxLength={20}
                  />
                ) : null}
                <TextField
                  icon={Mail}
                  placeholder={t.auth.email}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                />
                <TextField
                  icon={KeyRound}
                  placeholder={t.auth.password}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete={signUp ? 'new-password' : 'current-password'}
                  textContentType={signUp ? 'newPassword' : 'password'}
                  onSubmitEditing={() => canSubmit && submit()}
                />
                {signUp ? (
                  <Text variant="caption" color={colors.textMuted}>
                    {t.auth.usernameHint}
                  </Text>
                ) : null}
                {error ? <Text color={colors.danger}>{error}</Text> : null}
                {info ? <Text color={colors.successShade}>{info}</Text> : null}
                <Button
                  label={signUp ? t.auth.signUp : t.auth.signIn}
                  onPress={submit}
                  loading={loading}
                  disabled={!canSubmit}
                />
              </View>
            </Card>
          </Animated.View>

          <Button
            variant="ghost"
            haptic="tap"
            label={signUp ? t.auth.toSignIn : t.auth.toSignUp}
            sentence
            onPress={() => {
              setMode(signUp ? 'signIn' : 'signUp');
              setError(null);
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.xl },
  hero: { alignItems: 'center', gap: spacing.sm },
  water: {
    width: 200,
    height: 34,
    marginTop: 48,
    marginBottom: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: river.water,
    alignItems: 'center',
  },
  boat: { marginTop: -56 },
  form: { gap: spacing.lg },
});
