// WHERE THE MUSIC FILES LIVE — one setting (MUSIC_BASE in js/config.js). '' = this site's own audio/music/. To move the songs to a CDN or a
// bucket, upload the audio/music folder as it is and set MUSIC_BASE to its URL with a trailing slash ('https://cdn.example.com/music/'):
// nothing else changes. The host must send CORS headers (Access-Control-Allow-Origin) and honour byte ranges — the players read the files
// with <audio crossorigin="anonymous"> and fetch + decodeAudioData (the lobby's synced song). A `?v=N` cache-buster (music.js#REV) rides along.
import { MUSIC_BASE } from '../config.js';

/** the URL of a music file by its name without the extension ('c2-morning1', 'menu2'); query: '?v=2' or '' */
export const musicUrl = (name, query = '') => (MUSIC_BASE ? `${MUSIC_BASE}${name}.mp3${query}` : new URL(`../../audio/music/${name}.mp3${query}`, import.meta.url).href);
