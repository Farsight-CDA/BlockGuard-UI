import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { importYamlAsString } from './yaml-import/yaml-import-string';

export default defineConfig({
	plugins: [importYamlAsString(), sveltekit()],
	server: {
		fs: {
			allow: ['static']
		}
	},
	resolve: {
		extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.yaml']
	}
});
