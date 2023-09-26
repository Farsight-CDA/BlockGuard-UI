<script lang="ts">
	let triggerAnimation = false;

	export const fade = function triggerfade() {
		triggerAnimation = true;
	};
</script>

<div class="absolute w-full h-5/6 z-10 flex justify-center items-center">
	<slot />
</div>
<div class="landscape">
	<div
		class="fade {triggerAnimation ? '-translate-y-full' : '-translate-y-0'}"
		style={` transition: all 1.2s ease-out `}
	></div>
	<div class="mountain"></div>
	<div class="mountain mountain-2"></div>
	<div class="mountain mountain-3"></div>
	<div class=""></div>
	<div class="sun-container">
		<div class="sun"></div>
	</div>
	<div class="cloud"></div>
	<div class="cloud cloud-1"></div>
	<div class="light"></div>
	<div class="light light-1"></div>
	<div class="water"></div>

	<div class="lotus lotus-1"></div>
	<div class="lotus lotus-2"></div>
	<div class="lotus lotus-3"></div>
	<div class="front">
		<div class="grass"></div>
		<div class="grass grass-1"></div>
		<div class="grass grass-2"></div>
		<div class="reed"></div>
		<div class="reed reed-1"></div>
	</div>
</div>

<style>
	:root {
		--v1: #764d76;
		--v2: #4d2f80;
		--v3: #2f0f64;
		--transparentv3: #2f0f6400;
		--v4: #111827;
		--s1: #9e575c;
		--s2: #ad3732;
		--cloud: #9e575c;
	}

	.landscape:after,
	.landscape:before,
	.landscape *,
	.landscape *:after,
	.landscape *:before {
		position: absolute;
	}

	.fade {
		position: absolute;
		bottom: -200%;
		width: 100%;
		z-index: 2;
		height: 200%;
		background: linear-gradient(to bottom, transparent 0%, black 40%);
		overflow: hidden;
	}

	.front {
		z-index: 1;
		bottom: 0;
		left: 0;
		right: 0;
	}

	.landscape {
		width: 100%;
		height: 100%;
		background-image: linear-gradient(var(--v1), var(--s1), var(--v1));
		position: relative;
		z-index: 1;
		overflow: hidden;
	}

	.mountain {
		border-radius: 85% 80% 0% 0%/60vmin 60vmin 0% 0%;
		width: 35vmin;
		height: 28vmin;
		bottom: 50%;
		left: -10vmin;
		background: var(--s1);
		background-image: linear-gradient(var(--v1), var(--v2) 30%, var(--v3));
		&:before {
			content: '';
			width: inherit;
			height: inherit;
			background: inherit;
			border-radius: inherit;
			transform-origin: bottom center;
			transform: scaleX(1) scaleY(-0.6);
			filter: blur(4px);
		}
	}

	.mountain-2 {
		left: 12vmin;
		height: 15vmin;
		width: 40vmin;
		box-shadow: inset -17px 0 10px -14px var(--s1);
		border-radius: 120% 50% 0% 0%/25vmin 25vmin 0% 0%;
		background-image: linear-gradient(var(--v3), var(--v4));
	}

	.mountain-3 {
		border-radius: 60% 0% 0 0/100% 100% 0 0;
		right: -85vmin;
		width: 111vmin;
		left: auto;
		height: 12vmin;
		color: var(--v3);
		background-image: linear-gradient(var(--s1), var(--v4));
		box-shadow: inset 15px 0 10px -10px var(--s1);
	}

	.lotus {
		width: 10vmin;
		height: 5vmin;
		background: conic-gradient(
			var(--v3) 0deg 40deg,
			var(--transparentv3) 50deg 70deg,
			var(--v3) 80deg
		);
		border-radius: 50%;
	}

	.lotus-1 {
		bottom: 10vmin;
		right: 5vmin;
		width: 20vmin;
	}

	.lotus-2 {
		bottom: 20vmin;
		right: 15vmin;
		height: 3vmin;
		transform: skew(-10deg);
		opacity: 0.5;
		mix-blend-mode: multiply;
	}

	.lotus-3 {
		bottom: 10vmin;
		right: 35vmin;
		transform: rotate(180deg) skew(-15deg);
		opacity: 0.8;
		width: 15vmin;
	}

	.cloud {
		width: 80vmin;
		height: 6vmin;
		background: currentcolor;
		color: var(--cloud);
		top: 24vmin;
		left: 20vmin;
		border-radius: 50%;
		box-shadow:
			30vmin 0.5vmin 0 -1vmin currentcolor,
			-50vmin 0 0 -0.6vmin currentcolor;
		opacity: 0.3;
		transform: translate3d(-150vmin, 0, 0);
		animation: clouds 130s infinite;
	}
	@keyframes clouds {
		50% {
			transform: translate3d(0, 0, 0);
		}
		100% {
			transform: translate3d(160vmin, 0, 0);
		}
	}
	.cloud-1 {
		width: 60vmin;
		left: 60vmin;
		top: 15vmin;
		opacity: 0.4;
		filter: blur(1px);
		animation-duration: 110s;
	}

	.water {
		top: 50%;
		bottom: 0%;
		left: 0;
		right: 0;
		background: linear-gradient(#fea79855, var(--v4));
		overflow: hidden;
	}

	@-webkit-keyframes floatBubble {
		0% {
			top: 500px;
		}
		100% {
			top: 0px;
		}
	}
	@keyframes floatBubble {
		0% {
			top: 500px;
		}
		100% {
			top: 0px;
		}
	}

	.grass {
		height: 40vmin;
		width: 10vmin;
		border-radius: 0 60% 0 0/0 100% 0 0;
		bottom: 0;
		border-right: 5px solid var(--v4);
		box-shadow: 1px 0 0 var(--s1);
		filter: drop-shadow(-0.5vmin 6vmin 0 var(--s2))
			drop-shadow(-4.5vmin 10vmin 0 var(--v3));
	}

	.grass-1 {
		left: 14vmin;
		bottom: -2vmin;
		transform: scaleX(-1);
		box-shadow: 2px 0 0 var(--v4);
		border-color: var(--v3);
		filter: drop-shadow(-1vmin 5vmin 0 var(--v3))
			drop-shadow(-80vmin 5vmin 0 var(--v4));
	}

	.grass-2 {
		right: 0;
		left: auto;
		height: 20vmin;
		bottom: -2vmin;
		transform: scaleX(-1);
	}

	.sun {
		background: white;
		border-radius: 50%;
		width: 20vmin;
		height: 20vmin;
		left: 75%;
		top: 40%;
		box-shadow: 0 0 10px white;
	}
	.reed {
		height: 40vmin;
		width: 0.5vmin;
		bottom: 0;
		left: 10vmin;
		color: var(--v4);
		background: currentColor;
		transform-origin: bottom center;
		transform: rotate(4deg);
		box-shadow:
			inset -1px 0 0 var(--s2),
			-6vmin 3vmin 0 0,
			80vmin 0 0 0;
		animation: verticalise 20s infinite;
	}
	.reed-1 {
		color: var(--s2);
		left: 15vmin;
		height: 50vmin;
		bottom: -5vmin;
		transform: rotate(-2deg);
		box-shadow:
			inset -1px 0 0 var(--s1),
			6vmin 13vmin 0 0 var(--s1),
			80vmin 10vmin 0 0 var(--v3);
	}
	.reed:after {
		content: '';
		width: 1.5vmin;
		height: 10vmin;
		background: currentcolor;
		border-radius: 0.75vmin;
		top: 0;
		left: -0.5vmin;
		box-shadow: inherit;
	}
	@keyframes verticalise {
		0%,
		10% {
			transform: rotate(4deg);
		}
		30%,
		70% {
			transform: rotate(0);
		}
	}
	@keyframes verticalise-1 {
		0%,
		10% {
			transform: rotate(-2deg);
		}
		45%,
		70% {
			transform: rotate(0) translateY(-6vmin);
		}
	}

	.sun-container {
		overflow: hidden;
		width: 100%;
		height: 50%;
	}
</style>
