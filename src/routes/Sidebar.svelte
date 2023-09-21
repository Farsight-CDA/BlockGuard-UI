<script lang="ts">
	import { goto } from '$app/navigation';
	import { WALLET } from '$lib/wallet/wallet';
	import { createEventDispatcher } from 'svelte';

	let sliderPosition;

	export let isOpen: boolean;

	let count = 0;
	let configuration = false;

	const dispatch = createEventDispatcher();

	async function logout() {
		if (count > 0) {
			dispatch('close');
			sliderPosition = 0;
			isOpen = false;
			await goto('/setup');
			await WALLET.clear();
		}
		configuration = true;
		setTimeout(() => {
			count++;
		}, 1000);
	}
</script>

<div class="flex flex-row h-full w-full bg-gray-500">
	<div class="w-1/4 h-full" />
	<div class="w-1" />
	<div
		class="flex flex-col h-full w-full m items-center pt-32 gap-5 rounded-l-2xl bg-gray-900"
	>
		{#if $WALLET != null}
			<button on:click={() => logout()} class="bg-red-600 p-3 rounded-md"
				>{configuration ? 'are you sure?' : 'log out'}</button
			>
		{/if}
	</div>
</div>
