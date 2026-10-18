import { useEffect, useState } from 'react';

/** A hash router is enough: "#/", "#/lessons/<id>" and "#/words". */
export type Route = { name: 'course' } | { name: 'lesson'; id: string } | { name: 'words' };

function parse(hash: string): Route {
  const lesson = /^#\/lessons\/([^/]+)$/.exec(hash);
  if (lesson) return { name: 'lesson', id: decodeURIComponent(lesson[1]!) };
  if (hash === '#/words') return { name: 'words' };
  return { name: 'course' };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parse(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export const navigate = {
  course: () => (window.location.hash = '#/'),
  lesson: (id: string) => (window.location.hash = `#/lessons/${encodeURIComponent(id)}`),
  words: () => (window.location.hash = '#/words'),
};
