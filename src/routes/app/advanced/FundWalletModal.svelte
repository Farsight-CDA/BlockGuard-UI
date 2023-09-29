<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import { useCurrentPrices } from '$lib/priceData';
	import { useRequiredWallet } from '$lib/wallet/wallet';
	import MasterCard from '$static/Mastercard_2019_logo.svg';
	import Squid from '$static/Squid_Icon_Logo_Yellow.svg';
	import Visa from '$static/Visa_Inc_logo.svg';
	import { blur } from 'svelte/transition';

	var wallet = useRequiredWallet();
	var prices = useCurrentPrices();

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
		step = newStep;
	}
</script>

<Modal bind:open>
	{#if step === FundWalletStep.select}
		<div in:blur={{ duration: 200, delay: 0 }} class="flex flex-col gap-4">
			<h2 class="col-start-1 font-bold text-2xl text-center">
				Fund your Wallet
			</h2>
			<div
				class="col-start-1 col-end-3 grid grid-cols-2 text-right
					 bg-gray-700 rounded-md p-2 w-full"
			>
				<p>We suggest at least:</p>
				<p>{Math.ceil($prices.akt * 5.5 * 100) / 100}$</p>
				<p>you have currently:</p>
				<p>{Math.ceil($prices.akt * $balance * 100) / 100}$</p>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<button
					on:click={() => null}
					class="bg-gray-700 p-2 rounded-md"
					disabled={true}
					><p class="text-center text-lg">Deposit Crypto</p>
					<div class="grid grid-cols-1 gap-1 place-items-center">
						<img src={Squid} alt="" class="h-4" />
					</div>
				</button>
				<button
					on:click={() => null}
					class="bg-gray-700 p-2 rounded-md"
					disabled={true}
					><p class="text-center text-lg">Deposit Fiat</p>
					<div class="grid grid-cols-2 gap-1 place-items-center">
						<img src={MasterCard} alt="" class="h-4" />
						<img src={Visa} alt="" class="h-4" />
					</div>
				</button>
			</div>
			<button
				on:click={() => setStep(FundWalletStep.manual)}
				class="bg-green-400 hover:bg-green-500 drop-shadow-glow-green-400
					text-xl rounded-md"
				>Manual
			</button>
		</div>
	{:else if step === FundWalletStep.manual}
		<div
			in:blur={{ duration: 200, delay: 0 }}
			class="grid grid-cols-1 gap-2 place-items-center"
		>
			<h2 class="font-bold text-2xl">This is your address</h2>
			<h2 class="">Send funds to this address:</h2>
			<button
				on:click={copyToClipboard}
				class=" bg-slate-950 rounded-md border border-gray-700 w-full
			 p-2 md:flex md:flex-row"
			>
				<p>{part1}</p>
				<p>{part2}</p>
				<p>{part3}</p>
			</button>
			<div class="flex justify-center">
				<button
					on:click={() => setStep(FundWalletStep.select)}
					class=" bg-red-400 rounded-md hover:bg-red-500
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
