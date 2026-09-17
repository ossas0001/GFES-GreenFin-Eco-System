/**
 * Keep the original Cloudflare Pages URL as the public entry point while the
 * merged application runs in the bound backend Worker.
 */
const worker = {
  async fetch(request, env) {
    return env.BACKEND.fetch(request);
  },
};

export default worker;
