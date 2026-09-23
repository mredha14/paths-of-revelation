import { sites } from '@openai/sites-vite-plugin';
import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import hostingConfig from './.openai/hosting.json';

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  '00000000-0000-4000-8000-000000000000';

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === 'seatbelt';

const localBindingConfig = {
  main: 'vinext/server/app-router-entry',
  // `nodejs_compat` is declared once in `wrangler.jsonc`; declaring it here too
  // makes the Cloudflare plugin merge a duplicate flag and the runtime refuses
  // to start ("Compatibility flag specified multiple times: nodejs_compat").
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: 'site-creator-d1',
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: 'site-creator-r2',
        },
      ]
    : [],
};

const productionBindingConfig = {
  ...localBindingConfig,
  d1_databases: [],
  r2_buckets: [],
};

// Local development can talk to the real Cloudflare resources so the app
// mirrors production data. `wrangler.jsonc` marks its D1/R2 bindings
// `remote: true`, so omitting them here lets those real bound resources apply
// (Wrangler proxies to Cloudflare instead of simulating them locally).
// Authentication (CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID, or
// `wrangler login`) is required. Set `REMOTE_BINDINGS=0` to use the isolated
// local placeholders in `localBindingConfig` instead.
const useRemoteBindings = process.env.REMOTE_BINDINGS !== '0';

const remoteBindingConfig = {
  main: 'vinext/server/app-router-entry',
};

export default defineConfig(({ command }) => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= 'false';
  process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs';
  process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry';

  return {
    css: { postcss: { plugins: [tailwindcss()] } },
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
        remoteBindings: true,
        // The production Worker receives its real bindings from
        // `wrangler.jsonc`. Local previews use the real remote Cloudflare
        // resources by default; `REMOTE_BINDINGS=0` uses local placeholders.
        config:
          command === 'serve'
            ? useRemoteBindings
              ? remoteBindingConfig
              : localBindingConfig
            : productionBindingConfig,
      }),
    ],
  };
});
