<script lang="ts">
	import { goto } from '$app/navigation';
	import { useOptionalWallet } from '$lib/wallet/wallet';
	import { createEventDispatcher } from 'svelte';

	var wallet = useOptionalWallet();

	let isConfirmed = false;
	let showConfirmation = false;

	const dispatch = createEventDispatcher();

	async function logout() {
		setTimeout(() => {
			isConfirmed = true;
		}, 1000);

		showConfirmation = true;

		if (isConfirmed) {
			dispatch('close');
			await goto('/setup');
			await wallet.clear();
		}
	}
</script>

<div class="flex flex-row h-full w-full bg-gray-500">
	<div class="w-1/4 h-full" />
	<div class="w-1" />
	<div
		class="flex flex-col h-full w-full m items-center pt-32 gap-5 rounded-l-2xl bg-gray-900"
	>
		{#if $wallet != null}
			<button on:click={() => logout()} class="bg-red-600 p-3 rounded-md"
				>{showConfirmation ? 'Are you sure?' : 'Log Out'}</button
			>
		{/if}
	</div>
</div>
