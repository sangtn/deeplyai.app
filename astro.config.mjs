import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://deeplyai.app',
  // about.astro stays /about.html and apps/x/index.astro stays /apps/x/.
  build: { format: 'preserve' },
});
