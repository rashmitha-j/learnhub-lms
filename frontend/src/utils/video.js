// Converts a YouTube or Vimeo link into an embeddable player URL.
// Returns null for other URLs, which are opened as external links instead.
export const getEmbedUrl = (url) => {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\.|^m\./, '');

  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (parsed.pathname === '/watch') {
      const id = parsed.searchParams.get('v');
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    const match = parsed.pathname.match(/^\/(embed|shorts|live)\/([\w-]+)/);
    return match ? `https://www.youtube-nocookie.com/embed/${match[2]}` : null;
  }

  if (host === 'youtu.be') {
    const id = parsed.pathname.slice(1);
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }

  if (host === 'vimeo.com') {
    const id = parsed.pathname.match(/^\/(\d+)/)?.[1];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }

  if (host === 'player.vimeo.com') return url;

  return null;
};
