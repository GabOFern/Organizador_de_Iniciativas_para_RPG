import { useEffect, useState } from 'react';
import { api } from './api';
import { resolveApiUrl } from './config';

const masterSceneImagePrefix = '/api/scenes/';

export function isMasterSceneImagePath(url: string) {
  return url.startsWith(masterSceneImagePrefix);
}

export function useSceneImageSrc(url: string) {
  const [src, setSrc] = useState(() =>
    isMasterSceneImagePath(url) ? '' : resolveApiUrl(url),
  );

  useEffect(() => {
    if (!isMasterSceneImagePath(url)) {
      setSrc(resolveApiUrl(url));
      return;
    }

    let objectUrl = '';
    let cancelled = false;

    api.fetchAuthorizedBlob(url)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }

        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setSrc('');
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return src;
}
