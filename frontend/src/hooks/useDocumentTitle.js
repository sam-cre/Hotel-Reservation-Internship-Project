import { useEffect } from 'react';

const SITE_NAME = 'Stillwater Hotels';

// Sets the browser tab title for the current view. A null or empty title
// falls back to the site name alone, matching the static title in index.html.
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  }, [title]);
}
