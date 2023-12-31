<script lang="ts">
	import { goto } from '$app/navigation';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import {
		initializeGlobalConfig,
		useGlobalConfig
	} from '$lib/configuration/configuration';
	import { initializePriceData } from '$lib/priceData';
	import { initializeNativeAPI } from '$lib/native-api/native-api';
	import { initializeWalletStore, useOptionalWallet } from '$lib/wallet/wallet';
	import Gear from '$static/gear.svg';
	import Logo from '$static/logo.webp';
	import SettingsIcon from '$static/settings.svg';
	import { onMount } from 'svelte';
	import '../app.css';
	import BackgroundAnimation from './BackgroundAnimation.svelte';
	import ExportMnemonicModal from './app/ExportMnemonicModal.svelte';

	var wallet: ReturnType<typeof useOptionalWallet>;
	var globalConfig: ReturnType<typeof useGlobalConfig>;

	var initialized: boolean = false;

	onMount(async () => {
		const nativeApiWorks = await initializeNativeAPI();
		const globalConfigWorks = await initializeGlobalConfig();
		const walletWorks = await initializeWalletStore();
		const priceWorks = await initializePriceData();
		wallet = useOptionalWallet();
		globalConfig = useGlobalConfig();

		if (!nativeApiWorks || !globalConfigWorks || !priceWorks) {
			await goto('/error');
		} else {
			if (!walletWorks) {
				await goto('/setup');
			} else {
				if ($globalConfig.useAdvancedMode) {
					await goto('/app/advanced');
				} else {
					await goto('/app/simple');
				}
			}
		}

		initialized = true;
	});

	let showConfirmation = false;

	async function logout() {
		if (showConfirmation) {
			toggleSidebarAnimation();
			await goto('/setup');
			await wallet.clear();
		}

		showConfirmation = true;

		setTimeout(() => {
			showConfirmation = false;
		}, 5000);
	}

	export let openExportMnemonicModal: () => Promise<void>;
	let block = true;
	let open = false;
	function toggleSidebarAnimation() {
		open = !open;
		if (block) {
			setTimeout(() => {
				block = false;
			}, 1);
		}
		block = true;
	}

	function closeaaaa() {
		if (block) {
			return block;
		}
		block = true;
		open = false;
	}
</script>

<div class="flex flex-row h-full w-full font-armata">
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class={` flex flex-col h-full w-full z-10
		${open ? '-translate-x-80' : '-translate-x-0'} 
		  transform lg:translate-x-0 ${
				open ? 'xl:w-[calc(100%-22rem)] lg:w-[calc(100%-15rem)]' : 'lg:w-full'
			} `}
		style={` transition: all 0.5s ease-out `}
		on:click={closeaaaa}
	>
		<nav class={`bg-gray-900 py-2 px-3 flex h-20 flex-row justify-between `}>
			<div class="flex flex-row gap-3 items-center">
				<img src={Logo} alt="" class="h-12" />
				<h1 class="font-bold text-xl">BlockGuard</h1>
			</div>

			<button class={'z-10'} on:click={toggleSidebarAnimation}>
				<img src={Gear} class="h-12 invert" alt="Settings" />
			</button>
		</nav>
		<div class="grow flex-1 min-h-0 bg-black -z-50">
			<BackgroundAnimation count={$globalConfig?.useBubbleMode ? 50 : 0} />
			<main
				class={`w-full h-full overflow-y-auto 
			${open == true ? 'rounded-br-2xl' : ''}`}
			>
				{#if !initialized}
					<div class="w-full h-full flex justify-center items-center">
						<LoadingSpinner class="lg:w-1/12 w-1/6"></LoadingSpinner>
					</div>
				{:else}
					<div class="w-full flex min-h-full justify-center p-6">
						<slot />
					</div>
				{/if}
			</main>
		</div>
	</div>
	<div
		class="xl:w-90 lg:w-60 md:w-80 w-80
		absolute top-0 right-0 flex flex-col h-full items-center
		 bg-black"
	>
		<nav
			class={`bg-gray-900 py-2 px-3 flex flex-row w-full h-20 justify-center items-center `}
		>
			<div class="flex flex-row gap-3">
				<h1 class="font-bold text-xl text-center">Settings</h1>
			</div>
		</nav>

		<div
			class="xl:w-90 lg:w-60 md:w-80 w-80
		 		   flex flex-col grow items-center gap-5
            	   rounded-l-2xl p-5"
		>
			<div class="bg-gray-900 p-4 rounded-2xl w-full">
				<label class="flex justify-between items-center cursor-pointer">
					<img class="h-6" src={SettingsIcon} alt="" />

					<span class="ml-1 text-sm font-medium text-gray-300">
						Advanced Mode
					</span>
					<div class="ml-auto relative inset-y-0 right-0 w-11 h-6">
						<input
							type="checkbox"
							class="sr-only peer"
							checked={$globalConfig?.useAdvancedMode}
							on:change={(e) =>
								globalConfig.setAdvancedMode(e.currentTarget.checked)}
						/>
						<div
							class="w-11 h-6 bg-gray-200 rounded-full
							peer dark:bg-gray-700 peer-checked:after:translate-x-full
							after:absolute after:top-[2px] after:left-[2px] after:bg-white
							after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
						></div>
					</div>
				</label>
			</div>
			<div class="bg-gray-900 p-4 rounded-2xl w-full">
				<label class="flex justify-between items-center cursor-pointer">
					<img class="h-6" src={SettingsIcon} alt="" />

					<span class="ml-1 text-sm font-medium text-gray-300">
						Bubble Mode
					</span>
					<div class="ml-auto relative inset-y-0 right-0 w-11 h-6">
						<input
							type="checkbox"
							class="sr-only peer"
							checked={$globalConfig?.useBubbleMode}
							on:change={(e) =>
								globalConfig.setBubbleMode(e.currentTarget.checked)}
						/>
						<div
							class="w-11 h-6 bg-gray-200 rounded-full
							peer dark:bg-gray-700 peer-checked:after:translate-x-full
							after:absolute after:top-[2px] after:left-[2px] after:bg-white
							after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
						></div>
					</div>
				</label>
			</div>

			{#if $wallet != null}
				<button
					on:click={openExportMnemonicModal}
					class="bg-gray-900 p-3 rounded-md w-full">Export Mnemonics</button
				>
				<ExportMnemonicModal
					mnemonics={$wallet.getMnemonic()}
					bind:open={openExportMnemonicModal}
				/>
				<button
					on:click={logout}
					class={`${
						showConfirmation ? 'bg-red-600 p-3 ' : 'bg-red-900 p-3 '
					} w-full rounded-md mt-auto`}
					>{showConfirmation ? 'You sure?' : 'Log Out'}</button
				>
			{/if}
		</div>
	</div>
</div>
