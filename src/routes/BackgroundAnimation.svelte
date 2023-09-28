<script lang="ts">
	export let count: number = 6;

	function reverseGausRandom() {
		const randomValue = Math.random();

		const gradientValue = Math.pow(randomValue, 2);

		return Math.floor(gradientValue * 120);
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

	function init(count: number) {
		bubbles = [];
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
			bubbles.push(bubble);
		}
	}

	$: init(count);
</script>

<div class="absolute w-full h-full overflow-hidden -z-50 top-0">
	{#each bubbles as b}
		<div
			class="bubble overflow-hidden -z-50"
			style={`scale: ${b.size}; animation-duration: ${
				b.speed
			}s; animation-delay: ${b.delay}s; left: ${b.position}rem;
				rotate: -${b.rotation}deg;
				box-shadow:
					inset 20px -10px 50px -20px rgb(${255 - b.r * 75}, ${255 - b.g * 30}, ${
						255 - b.b * 15
					}),
					inset -40px 12px 20px -40px rgb(${128 - b.r * 30}, ${128 - b.g * 10}, ${
						128 - b.b * 30
					});`}
		>
			<div
				class="bubble-shine"
				style={`scale: ${b.size}; 
					box-shadow:
					inset -5px -10px 70px 0px rgb(${0 + b.r * 5}, ${0 + b.g * 20}, ${
						0 + b.b * 25
					})`}
			></div>
		</div>
	{/each}
</div>

<style>
	@keyframes myAnimation {
		0% {
			bottom: -15rem;
			transform: scale(1);
			opacity: 1;
		}

		90% {
			opacity: 0.5;
		}
		100% {
			bottom: 45%;
			transform: scale(2);
			opacity: 0;
		}
	}

	.bubble {
		animation: myAnimation 100s ease-in infinite;
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
		width: 6rem;
		height: 6rem;
		background-color: white;
		border-radius: 44% 56% 46% 54% / 36% 50% 50% 64%;
	}
</style>
