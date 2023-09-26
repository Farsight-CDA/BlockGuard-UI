/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontSize: {
				xxs: '0.625rem'
			},
			spacing: {
				90: '22rem'
			},
			dropShadow: {
				glow: [
					'0 0px 20px rgba(255,255, 255, 0.1)',
					'0 0px 65px rgba(255, 255,255, 0.2)'
				],
				// Shadows for red
				'glow-black-100': [
					'0 0px 20px rgba(0, 0, 0, 0.35)',
					'0 0px 65px rgba(0, 0, 0, 0.2)'
				],
				// Shadows for red
				'glow-red-100': [
					'0 0px 20px rgba(255, 0, 0, 0.35)',
					'0 0px 65px rgba(255, 0, 0, 0.2)'
				],

				// Shadows for green
				'glow-green-400': [
					'0 0px 10px rgba(74, 222, 128, 0.2)',
					'0 0px 35px rgba(74, 222, 128, 0.1)'
				],
				// Shadows for blue
				'glow-blue-400': [
					'0 0px 10px rgba(96, 165, 250, 0.2)',
					'0 0px 35px rgba(96, 165, 250, 0.1)'
				]
			},
			blur: {
				xs: '1px'
			}
		},
		fontFamily: {
			armata: ['Armata', 'sans']
		}
	},
	plugins: []
};
