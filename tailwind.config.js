/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			spacing: {
				90: '22rem'
			},
			dropShadow: {
				glow: [
					'0 0px 20px rgba(255,255, 255, 0.35)',
					'0 0px 65px rgba(255, 255,255, 0.2)'
				],
				// Shadows for red
				'glow-red-100': [
					'0 0px 20px rgba(255, 0, 0, 0.35)',
					'0 0px 65px rgba(255, 0, 0, 0.2)'
				],

				// Shadows for green
				'glow-green-400': [
					'0 0px 20px rgba(74, 222, 128, 0.35)',
					'0 0px 65px rgba(74, 222, 128, 0.2)'
				],
				// Shadows for blue
				'glow-blue-400': [
					'0 0px 20px rgba(96, 165, 250, 0.35)',
					'0 0px 65px rgba(96, 165, 250, 0.2)'
				]
			}
		},
		fontFamily: {
			armata: ['Armata', 'sans']
		}
	},
	plugins: []
};
