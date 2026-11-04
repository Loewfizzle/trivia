// The look previews' fake Firebase (fake-firebase.js) — SIGNED IN: /api calls go out with a token (the page answers them itself).
// Used by profile-preview.html (the REAL profile screen with scripted data). A local export shadows the star export.
export * from './fake-firebase.js';
export const idToken = () => Promise.resolve('preview-token');
