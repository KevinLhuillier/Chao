import { BookOpen, Database, LogOut, Sailboat } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { AdminUser, ServerStatus } from '../shared/api';
import { Badge, Button, ToastProvider } from './components/ui';
import { api, setSignedOutHandler } from './lib/api';
import { useRoute } from './lib/router';
import { CoursePage } from './pages/CoursePage';
import { LessonPage } from './pages/LessonPage';
import { SignInPage } from './pages/SignInPage';
import { WordsPage } from './pages/WordsPage';

export function App() {
  const route = useRoute();
  const [server, setServer] = useState<ServerStatus | null>(null);
  /** undefined while checking the session, null when signed out. */
  const [user, setUser] = useState<AdminUser | null | undefined>(undefined);

  useEffect(() => {
    api.status().then(setServer, () => setServer(null));
    api.me().then(setUser, () => setUser(null));
    setSignedOutHandler(() => setUser(null));
  }, []);

  const signOut = async () => {
    await api.signOut().catch(() => {});
    setUser(null);
  };

  if (user === undefined) return null;
  if (user === null) {
    return (
      <ToastProvider>
        <SignInPage server={server} onSignedIn={setUser} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="app">
        <header className="topbar">
          <a className="brand" href="#/">
            <span className="brand-mark">
              <Sailboat size={20} />
            </span>
            Chào
          </a>
          <Badge tone="primary">Admin</Badge>
          <nav className="nav">
            <a
              className="nav-link"
              href="#/"
              aria-current={route.name !== 'words' ? 'page' : undefined}>
              <Sailboat size={16} /> Parcours
            </a>
            <a
              className="nav-link"
              href="#/words"
              aria-current={route.name === 'words' ? 'page' : undefined}>
              <BookOpen size={16} /> Vocabulaire
            </a>
          </nav>
          <span className="spacer" />
          {/* Signing in needs Supabase, so it is always configured past this point. */}
          <Badge tone="success">
            <Database size={14} /> Supabase connecté
          </Badge>
          <span className="t-caption c-secondary">{user.email}</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Se déconnecter"
            title="Se déconnecter"
            onClick={signOut}>
            <LogOut size={18} />
          </Button>
        </header>
        {route.name === 'lesson' ? (
          <LessonPage key={route.id} id={route.id} />
        ) : route.name === 'words' ? (
          <WordsPage />
        ) : (
          <CoursePage />
        )}
      </div>
    </ToastProvider>
  );
}
