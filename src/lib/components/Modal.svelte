<script lang="ts">
	import { blur } from 'svelte/transition';

	let dialogElement: HTMLDialogElement;
	var isOpen: boolean = false;

	export const open = async function open() {
		isOpen = true;
		dialogElement.showModal();
	};

	export const close = function close() {
		dialogElement.close();
		isOpen = false;
	};
	function dialogClickHandler(e: MouseEvent) {
		if (e.target === dialogElement) {
			close();
		}
	}
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<dialog
	bind:this={dialogElement}
	class="p-4 rounded-2xl bg-custom-blue backdrop:backdrop-brightness-50 backdrop:backdrop-blur-xs drop-shadow-glow"
	style="overflow: hidden; scrollbar-width: none;"
	on:click={dialogClickHandler}
	on:keydown={() => {}}
>
	{#if isOpen}
		<div transition:blur={{ duration: 200, delay: 0 }}>
			<slot />
		</div>
	{/if}
</dialog>
