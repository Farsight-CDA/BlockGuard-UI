<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import { useRequiredWallet } from '$lib/wallet/wallet';
	import { blur } from 'svelte/transition';

	var wallet = useRequiredWallet();

	export let open: () => Promise<void>;

	function copyToClipboard() {
		navigator.clipboard.writeText($wallet.getAddress());
	}

	enum FundWalletStep {
		select,
		manual,
		kado,
		kip,
		load
	}

	const address = $wallet.getAddress();
	const sub = Math.floor(address.length / 3);
	let part1 = address.slice(0, sub);
	let part2 = address.slice(sub, sub * 2 + 1);
	let part3 = address.slice(sub * 2 + 1, address.length);

	var balance = $wallet.balance;

	var step: FundWalletStep = FundWalletStep.select;

	function setStep(newStep: FundWalletStep) {
		step = FundWalletStep.load;
		setTimeout(() => {
			step = newStep;
		}, 300); ///eeeeeeh scheint so zu gehen ohne das es flackert hab schon in der AddLocationModal.svelte geschaut
	}
</script>

<Modal bind:open>
	{#if step === FundWalletStep.select}
		<div transition:blur={{ duration: 200, delay: 0 }}>
			<div class="flex flex-col items-center pb-4" on:introstart on:outroend>
				<h2 class="font-bold text-lg">Fund your Wallet</h2>
				<div class="md:flex md:flex-row">
					<p>We surgest at least 5.5 akt</p>
					<p>you have currently {$balance} akt</p>
				</div>
			</div>
			<div class="flex flex-row gap-4 pt-2">
				<button
					on:click={() => setStep(FundWalletStep.manual)}
					class="bg-green-400 hover:bg-green-500 drop-shadow-glow-green-400 p-3 rounded-md w-full"
					>Manual
				</button>
				<button
					on:click={() => null}
					class="bg-gray-600 p-3 rounded-md w-full"
					disabled={true}
					>Kado Money
					<p
						id="helper-checkbox-text"
						class="text-xxs font-light text-gray-500 dark:text-gray-300"
					>
						comming soon
					</p></button
				>
				<button
					on:click={() => null}
					class="bg-gray-600 p-3 rounded-md w-full"
					disabled={true}
					>Kip API
					<p
						id="helper-checkbox-text"
						class="text-xxs font-light text-gray-500 dark:text-gray-300"
					>
						comming soon
					</p></button
				>
			</div>
		</div>
	{/if}
	{#if step === FundWalletStep.manual}
		<div transition:blur={{ duration: 200, delay: 0 }}>
			<h2 class="font-bold text-lg ml-1">This is you wallet address</h2>
			<h2 class="font-bold text-sm mt-4 ml-1">
				Please send funds to this address:
			</h2>
			<button
				on:click={copyToClipboard}
				class=" bg-blue-400 rounded-md drop-shadow-glow-blue-400 w-full
			pl-2 pr-2 md:flex md:flex-row"
			>
				<p>{part1}</p>
				<p>{part2}</p>
				<p>{part3}</p>
			</button>
			<div class="flex justify-center">
				<button
					on:click={() => setStep(FundWalletStep.select)}
					class=" bg-red-400 rounded-md drop-shadow-glow-red-100
			pl-2 pr-2 md:flex md:flex-row mt-2"
				>
					Back to Selection
				</button>
			</div>
		</div>
	{/if}
	{#if step === FundWalletStep.kado}
		<div>kado</div>
	{/if}
	{#if step === FundWalletStep.kip}
		<div>kip</div>
	{/if}
</Modal>
