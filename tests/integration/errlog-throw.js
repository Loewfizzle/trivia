// e2e-loading.mjs: a same-origin script with a bug in it, so the test's error comes from "our code" like a real one.
window.__ownThrow = () => setTimeout(() => { throw new TypeError('e2e: a code error on the title'); }, 0);
