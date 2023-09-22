import type { Plugin } from 'vite';

const yamlExtension = /\.ya?ml$/;

export function importYamlAsString(): Plugin {
	return {
		name: 'vite:yaml-import-string',
		async transform(code: string, id: string) {
			if (!yamlExtension.test(id)) {
				return null;
			}

			const encodedData = btoa(code);

			return {
				code: `const e = '${encodedData}'; const d = atob(e); export default d;`,
				map: { mappings: '' }
			};
		}
	};
}
