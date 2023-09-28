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
		skip,
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
		}, 1); ///eeeeeeh scheint so zu gehen ohne das es flackert hab schon in der AddLocationModal.svelte geschaut
	}
</script>

<Modal bind:open>
	{#if step === FundWalletStep.select}
		<div in:blur={{ duration: 200, delay: 0 }} class="m-6">
			<div class="flex flex-col items-center pb-6" on:introstart on:outroend>
				<h2 class="font-bold text-2xl">Fund your Wallet</h2>
				<div>
					<p>We surgest at least 5.5 akt</p>
					<p>you have currently {$balance} akt</p>
				</div>
			</div>
			<div class="grid md:grid-cols-3 grid-cols-1 gap-4 pt-2">
				<button
					on:click={() => setStep(FundWalletStep.manual)}
					class="bg-green-400 hover:bg-green-500 drop-shadow-glow-green-400 p-3 text-xl rounded-md w-full"
					>Manual
				</button>
				<button
					on:click={() => null}
					class="bg-gray-600 p-3 rounded-md w-full text-xl"
					disabled={true}
					>Kado Money
					<p
						id="helper-checkbox-text"
						class="text-xs font-light text-gray-500 dark:text-gray-300"
					>
						coming soon
					</p></button
				>
				<button
					on:click={() => null}
					class="bg-gray-600 p-3 rounded-md w-full text-xl"
					disabled={true}
					>Skip API
					<p
						id="helper-checkbox-text"
						class="text-xs font-light text-gray-500 dark:text-gray-300"
					>
						coming soon
					</p></button
				>
			</div>
		</div>
	{:else if step === FundWalletStep.manual}
		<div in:blur={{ duration: 200, delay: 0 }} class="m-6">
			<h2 class="font-bold text-xl ml-1">This is you address</h2>
			<h2 class="font-bold text-sm mt-4 ml-1">Send funds to this address:</h2>
			<button
				on:click={copyToClipboard}
				class=" bg-custom-pink rounded-md drop-shadow-glow-blue-400 w-full
			 p-4 md:flex md:flex-row"
			>
				<p>{part1}</p>
				<p>{part2}</p>
				<p>{part3}</p>
			</button>
			<div class="flex justify-center mt-5">
				<button
					on:click={() => setStep(FundWalletStep.select)}
					class=" bg-red-400 rounded-md drop-shadow-glow-red-100 p-2
			pl-2 pr-2 md:flex md:flex-row"
				>
					Back to Selection
				</button>
			</div>
		</div>
	{:else if step === FundWalletStep.kado}
		<div>kado</div>
	{:else if step === FundWalletStep.skip}
		<div>kip</div>
	{/if}
</Modal>
