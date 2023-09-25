<script lang="ts">
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
	class="p-4 rounded-2xl bg-slate-900 backdrop:backdrop-saturate-50 drop-shadow-glow"
	style="overflow: hidden; scrollbar-width: none;"
	on:click={dialogClickHandler}
	on:keydown={() => {}}
>
	{#if isOpen}
		<slot />
	{/if}
</dialog>
