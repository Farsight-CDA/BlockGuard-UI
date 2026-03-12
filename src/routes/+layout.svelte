<script lang="ts">
	import { goto } from '$app/navigation';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import {
		DEFAULT_RPC_URL,
		initializeGlobalConfig,
		useGlobalConfig
	} from '$lib/configuration/configuration';
	import { initializeNativeAPI } from '$lib/native-api/native-api';
	import { initializeAktPrice } from '$lib/wallet/aktPrice';
	import { getWalletErrorMessage } from '$lib/wallet/errors';
	import { initializeWalletStore, useOptionalWallet } from '$lib/wallet/wallet';
	import Gear from '$static/gear.svg';
	import Logo from '$static/logo.webp';
	import SettingsIcon from '$static/settings.svg';
	import { onMount } from 'svelte';
	import '../app.css';
	import BackgroundAnimation from './BackgroundAnimation.svelte';
	import ExportMnemonicModal from './app/ExportMnemonicModal.svelte';

	enum Status {
		Uninitialized,
		Ready,
		Failed
	}

	var status:
		| { status: Status.Uninitialized }
		| { status: Status.Ready }
		| { status: Status.Failed; reason: string } = {
		status: Status.Uninitialized
	};

	var wallet: ReturnType<typeof useOptionalWallet>;
	var globalConfig: ReturnType<typeof useGlobalConfig>;

	onMount(async () => {
		try {
			const nativeApiWorks = await initializeNativeAPI();
			const globalConfigWorks = await initializeGlobalConfig();
			const walletWorks = await initializeWalletStore();
			const priceWorks = await initializeAktPrice();
			wallet = useOptionalWallet();
			globalConfig = useGlobalConfig();

			if (!priceWorks) {
				status = {
					status: Status.Failed,
					reason: 'Failed to fetch the current AKT price.'
				};
				return;
			} else if (!nativeApiWorks) {
				status = {
					status: Status.Failed,
					reason: 'Unable to connect to native device bindings.'
				};
				return;
			} else if (!globalConfigWorks) {
				status = {
					status: Status.Failed,
					reason:
						'Failed to load config. Try resetting or reinstalling the app.'
				};
				return;
			}

			if (!walletWorks) {
				await goto('/setup');
			} else {
				if ($globalConfig.useAdvancedMode) {
					await goto('/app/advanced');
				} else {
					await goto('/app/simple');
				}
			}

			status = { status: Status.Ready };
		} catch (error) {
			status = { status: Status.Failed, reason: getWalletErrorMessage(error) };
			return;
		}
	});

	let showConfirmation = false;
	let rpcUrlInput = DEFAULT_RPC_URL;
	let rpcUrlDirty = false;
	let isSavingRpcUrl = false;
	let rpcUrlMessage: { tone: 'success' | 'error'; text: string } | null = null;

	$: if ($globalConfig != null && !rpcUrlDirty && rpcUrlInput != $globalConfig.rpcUrl) {
		rpcUrlInput = $globalConfig.rpcUrl;
	}

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

	let openExportMnemonicModal: () => Promise<void>;
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

	function closeSidebar() {
		if (block) {
			return block;
		}
		block = true;
		open = false;
	}

	function reload() {
		location.reload();
	}

	function handleAdvancedModeChange(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		void globalConfig.setAdvancedMode(target.checked);
	}

	function handleBubbleModeChange(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		void globalConfig.setBubbleMode(target.checked);
	}

	function handleRpcUrlInput(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		rpcUrlInput = target.value;
		rpcUrlDirty = true;
		rpcUrlMessage = null;
	}

	async function saveRpcUrl() {
		if (globalConfig == null) {
			return;
		}

		isSavingRpcUrl = true;
		rpcUrlMessage = null;

		try {
			const normalizedRpcUrl = await globalConfig.setRpcUrl(rpcUrlInput);
			rpcUrlInput = normalizedRpcUrl;
			rpcUrlDirty = false;
			rpcUrlMessage = {
				tone: 'success',
				text: 'RPC URL saved. BlockGuard will reconnect automatically.'
			};
		} catch (error) {
			rpcUrlMessage = {
				tone: 'error',
				text: getWalletErrorMessage(error)
			};
		} finally {
			isSavingRpcUrl = false;
		}
	}

	async function useRecommendedRpcUrl() {
		rpcUrlInput = DEFAULT_RPC_URL;
		rpcUrlDirty = true;
		await saveRpcUrl();
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
		on:click={closeSidebar}
	>
		<nav class={`bg-gray-900 py-2 px-3 flex h-20 flex-row justify-between `}>
			<div class="flex flex-row gap-3 items-center">
				<img src={Logo} alt="" class="h-12" />
				<h1 class="font-bold text-xl">BlockGuard</h1>
			</div>

			{#if status.status != Status.Failed}
				<button class={'z-10'} on:click={toggleSidebarAnimation}>
					<img src={Gear} class="h-12 invert" alt="Settings" />
				</button>
			{/if}
		</nav>
		<div class="grow flex-1 min-h-0 bg-black -z-50">
			<BackgroundAnimation count={$globalConfig?.useBubbleMode ? 50 : 0} />
			<main
				class={`w-full h-full overflow-y-auto 
			${open == true ? 'rounded-br-2xl' : ''}`}
			>
				{#if status.status == Status.Uninitialized}
					<div class="w-full h-full flex justify-center items-center">
						<LoadingSpinner class="lg:w-1/12 w-1/6"></LoadingSpinner>
					</div>
				{:else if status.status == Status.Ready}
					<div class="w-full flex min-h-full justify-center p-6">
						<slot />
					</div>
				{:else if status.status == Status.Failed}
					<div class="w-full flex flex-col min-h-full items-center p-6">
						<h2 class="font-bold text-lg">
							An error occured while starting the app
						</h2>
						<p>{status.reason}</p>

						<button
							class="mt-auto mb-auto px-3 py-2 bg-yellow-500 font-bold rounded-md"
							on:click={reload}>Reload</button
						>
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
							on:change={handleAdvancedModeChange}
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
							on:change={handleBubbleModeChange}
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
			<div class="bg-gray-900 p-4 rounded-2xl w-full flex flex-col gap-3">
				<div class="flex items-center gap-3">
					<img class="h-6" src={SettingsIcon} alt="" />
					<div>
						<p class="text-sm font-medium text-gray-300">Akash RPC URL</p>
						<p class="text-xs text-gray-400">
							Recommended: `https://akash-rpc.publicnode.com/`
						</p>
					</div>
				</div>

				<input
					type="url"
					class="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-sm text-white"
					placeholder="https://akash-rpc.publicnode.com/"
					value={rpcUrlInput}
					on:input={handleRpcUrlInput}
					spellcheck="false"
					autocomplete="off"
				/>

				<div class="flex gap-2">
					<button
						class="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium disabled:bg-gray-700"
						disabled={!rpcUrlDirty || isSavingRpcUrl}
						on:click={saveRpcUrl}
					>
						{isSavingRpcUrl ? 'Saving...' : 'Save RPC'}
					</button>
					<button
						class="rounded-md bg-gray-700 px-3 py-2 text-sm font-medium"
						disabled={isSavingRpcUrl}
						on:click={useRecommendedRpcUrl}
					>
						Use Default
					</button>
				</div>

				{#if rpcUrlMessage != null}
					<p
						class:text-green-300={rpcUrlMessage.tone == 'success'}
						class:text-red-200={rpcUrlMessage.tone == 'error'}
						class="text-xs"
					>
						{rpcUrlMessage.text}
					</p>
				{/if}
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
