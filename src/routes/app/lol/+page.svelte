<script lang="ts">
	const count = 20;

	function reverseGausRandom() {
		/// Generate a random number between 0 and 1
		const randomValue = Math.random();

		// Use a quadratic function to create the gradient
		const gradientValue = Math.pow(randomValue, 2);

		// Map the gradient to the range of 0 to 100
		return Math.floor(gradientValue * 90);
	}

	interface bubble {
		position: number;
		delay: number;
		hight: number;
		size: number;
		speed: number;
	}

	let bubbles: bubble[] = [];

	for (let i = 0; i < count; i++) {
		const bubble: bubble = {
			position: reverseGausRandom(),
			delay: Math.random() * 20,
			hight: Math.random() * 100,
			size: Math.random(),
			speed: Math.random() * 5
		};
		console.log(bubble.position);
		bubbles.push(bubble);
	}
	let animationSpeed = 5;
</script>

<div class="w-full h-full bg-black">
	<div class="relative w-full h-full">
		{#each bubbles as b}
			<div
				class="moving-bubble"
				style={`
                position: absolute;
                right :${b.position}%; animation-delay: ${b.delay}s;
                bottom: -100%
                animation-duration: ${b.speed}s;
                animation: moving 20s cubic-bezier(0.4, 0, 1, 1) infinite;
                `}
			>
				<div
					class="w-60 h-60 bg-transparent flex justify-center items-center"
					style={`
                        scale: ${b.size};
                        border-radius: 51% 49% 48% 52% / 62% 44% 56% 38%;
                        box-shadow: inset 20px -10px 50px -20px white,
                        inset -40px 12px 20px -40px gray;`}
				>
					<div
						class="ml-32 mb-8 w-20 h-20 bg-white"
						style="
                        border-radius: 51% 49% 48% 52% / 62% 44% 56% 38%;
                        box-shadow: inset 0px 0px 50px 0px black;"
					></div>
				</div>
			</div>
		{/each}
	</div>
	<div class="animated-div" style="animation-duration: {animationSpeed}s;">
		This is an animated div.
	</div>
</div>

<style>
	@keyframes moving {
		from {
			bottom: -20%;
		}
		to {
			bottom: 40%;
		}
	}

	.animate-moving {
		animation: moving 20s cubic-bezier(0.4, 0, 1, 1) infinite;
	}
	.animate-grow {
		animation: ping 20s infinite;
	}

	@keyframes myAnimation {
		0% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-50px);
		}
		100% {
			transform: translateY(0);
		}
	}

	.animated-div {
		width: 100px;
		height: 100px;
		background-color: blue;
		animation: myAnimation 2s ease-in-out infinite;
	}
	.moving-bubble {
		position: absolute;

		bottom: -100%;

		animation: moving 20s cubic-bezier(0.4, 0, 1, 1) infinite;
	}
</style>
