// client/src/hooks/useHashRoute.js
import { useCallback, useEffect, useState } from 'react';

const read = () => window.location.hash.replace(/^#/, '') || '/';

export default function useHashRoute() {
  const [path, setPath] = useState(read);

  useEffect(() => {
    const onChange = () => {
      setPath(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((to) => {
    window.location.hash = to;
  }, []);

  return { path, navigate };
}
