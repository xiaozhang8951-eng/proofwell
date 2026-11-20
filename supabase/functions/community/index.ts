// Supabase Edge Runtime entrypoint. All request behavior is tested in handler.mjs.
import { createHandler } from './handler.mjs';
Deno.serve(createHandler({ env: (name: string) => Deno.env.get(name), fetch: globalThis.fetch }));
