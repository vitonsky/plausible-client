import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environmentOptions: {
			jsdom: {
				url: 'https://example.org',
			},
		},
	},
});
