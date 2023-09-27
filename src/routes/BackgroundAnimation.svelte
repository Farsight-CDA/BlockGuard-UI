<script lang="ts">
	export const count = 20;

	function reverseGausRandom() {
		/// Generate a random number between 0 and 1
		const randomValue = Math.random();

		// Use a quadratic function to create the gradient
		const gradientValue = Math.pow(randomValue, 2);

		// Map the gradient to the range of 0 to 100
		return Math.floor(gradientValue * 85);
	}

	interface Bubble {
		position: number;
		delay: number;
		hight: number;
		size: number;
		speed: number;
		rotation: number;
		r: number;
		g: number;
		b: number;
	}

	let bubbles: Bubble[] = [];

	for (let i = 0; i < count; i++) {
		const leon = Math.random() * 10 + 8;
		const bubble: Bubble = {
			position: reverseGausRandom(),
			delay: leon % 8, // 0 - 7 and yes
			hight: Math.random() * 100,
			size: Math.random() * 0.4 + 0.1,
			speed: leon,
			rotation: Math.random() * 40,
			r: Math.random(),
			g: Math.random(),
			b: Math.random()
		};
		console.log(bubble.position);
		bubbles.push(bubble);
	}
</script>

<div class="w-full h-full bg-red bg-black -z-50">
	<div class="relative w-full h-full">
		<slot />
	</div>
	<div class="absolute w-full h-full overflow-hidden -z-50 top-0">
		{#each bubbles as b}
			<div
				class="bubble overflow-hidden -z-50"
				style={`scale: ${b.size}; animation-duration: ${
					b.speed
				}s; animation-delay: ${b.delay}s; left: ${b.position}rem;
				rotate: -${b.rotation}deg;
				box-shadow:
					inset 20px -10px 50px -20px rgb(${255 - b.r * 70}, ${255 - b.b * 25}, ${
						255 - b.g * 5
					}),
					inset -40px 12px 20px -40px rgb(${128 - b.r * 40}, ${128 - b.b * 20}, ${
						128 - b.g * 10
					});`}
			>
				<div
					class="bubble-shine"
					style={`scale: ${b.size}; 
					box-shadow:
					inset -5px -10px 70px 0px rgb(${0 + b.r * 5}, ${0 + b.b * 20}, ${
						0 + b.g * 20
					})`}
				></div>
			</div>
		{/each}
	</div>
</div>

<style>
	@keyframes myAnimation {
		0% {
			bottom: -15rem;
		}
		100% {
			bottom: 45%;
		}
	}

	.bubble {
		animation:
			myAnimation 100s ease-in infinite,
			ping 100s ease-in infinite;
		scale: 0.1;
		display: flex;
		justify-content: center;
		align-items: center;
		position: absolute;
		background-color: black;
		bottom: -15rem;
		width: 15rem;
		height: 15rem;
		border-radius: 51% 49% 48% 52% / 62% 44% 56% 38%;
	}

	.bubble-shine {
		margin-left: 8rem;
		margin-bottom: 2rem;
		width: 5rem;
		height: 5rem;
		background-color: white;
		border-radius: 44% 56% 46% 54% / 36% 50% 50% 64%;
		box-shadow: inset -5px -10px 70px 0px black;
	}
</style>
