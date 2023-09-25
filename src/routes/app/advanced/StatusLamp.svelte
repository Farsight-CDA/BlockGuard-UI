<script lang="ts" context="module">
	export enum StatusLampStatus {
		Loading,
		Error,
		ActionRequired,
		Warning,
		Ready
	}
</script>

<script lang="ts">
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import { createEventDispatcher } from 'svelte';

	export let name: string;
	export let status: StatusLampStatus;
	export let clickable: boolean = false;

	export let value: number | null = null;

	const dispatch = createEventDispatcher();

	function triggerForwardClick() {
		dispatch('click');
	}
</script>

<div
	class="flex flex-col gap-3 justify-between items-center bg-neutral-900 rounded-md p-2 text-center"
>
	<button
		class="w-1/2 sm:w-1/3 md:w-7/12 aspect-square rounded-full flex justify-center items-center"
		on:click={triggerForwardClick}
		on:keydown={() => {}}
		disabled={!clickable}
		class:bg-neutral-400={status == StatusLampStatus.Loading}
		class:bg-red-800={status == StatusLampStatus.Error}
		class:bg-yellow-400={status == StatusLampStatus.Warning}
		class:bg-green-400={status == StatusLampStatus.Ready}
		class:bg-red-400={status == StatusLampStatus.ActionRequired}
		class:drop-shadow-glow-red-400={status == StatusLampStatus.Error}
		class:drop-shadow-glow-green-400={status == StatusLampStatus.Ready}
	>
		{#if status == StatusLampStatus.Loading}
			<LoadingSpinner></LoadingSpinner>
		{:else if value != null}
			<p>{value}</p>
		{/if}
	</button>
	<h4 class="font-bold">{name}</h4>
</div>
