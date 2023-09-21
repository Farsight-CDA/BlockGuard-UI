<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import '../app.css';
	import Logo from '@static/logo.webp';
	import Gear from '@static/gear.svg';
	import { initializeNativeAPI } from '$lib/native-api/native-api';
	import { WALLET } from '$lib/wallet/wallet';
	import {
		GLOBAL_CONFIG,
		initializeGlobalConfig
	} from '$lib/configuration/configuration';
	import { goto } from '$app/navigation';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	var initialized: boolean = false;

	onMount(async () => {
		const nativeApiWorks = await initializeNativeAPI();
		const globalConfigWorks = await initializeGlobalConfig();
		const walletWorks = await WALLET.initialize();

		setTimeout(async () => {
			if (!nativeApiWorks) {
				await goto('/error');
			} else {
				if (!walletWorks) {
					await goto('/setup');
				} else {
					if ($GLOBAL_CONFIG?.useAdvancedMode) {
						await goto('/app/advanced');
					} else {
						await goto('/app/simple');
					}
				}
			}

			initialized = true;
		}, 250);
	});
</script>

<div class="flex flex-col h-full w-full">
	<nav class="bg-gray-900 py-2 px-3 flex flex-row justify-between">
		<div class="flex flex-row gap-3 items-center">
			<img src={Logo} alt="" class="h-12" />
			<h1 class="font-bold text-xl">BlockGuard</h1>
		</div>

		<button>
			<img src={Gear} class="h-12 invert" alt="Settings" />
		</button>
	</nav>
	<main
		class="bg-black h-full overflow-y-auto overflow-x-hidden p-3 flex flex-col items-center"
	>
		{#if !initialized}
			<div class="w-full h-full flex justify-center items-center">
				<LoadingSpinner class="lg:w-1/12 w-1/6"></LoadingSpinner>
			</div>
		{:else}
			<slot />
		{/if}
	</main>
</div>
