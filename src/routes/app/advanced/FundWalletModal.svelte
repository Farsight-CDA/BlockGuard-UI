<script lang="ts">
	import { scale } from 'svelte/transition';
	import { type Wallet, WALLET } from '$lib/wallet/wallet';
	import { MsgCreateDeployment } from '@playwo/akashjs/build/protobuf/akash/deployment/v1beta3/deploymentmsg';
	import VpnSdlUrl from '@static/vpn-sdl.txt';
	import { SDL } from '@playwo/akashjs/build/sdl';
	import type { DeploymentBid } from '$lib/types/types';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	let dialogElement: HTMLDialogElement;
	var isOpen: boolean = false;

	var wallet: Wallet;
	$: wallet = $WALLET!;

	export const open = async function open() {
		isOpen = true;
		dialogElement.showModal();
	};

	function close() {
		dialogElement.close();
		isOpen = false;
	}
	function dialogClickHandler(e: MouseEvent) {
		if (e.target === dialogElement) {
			close();
		}
	}
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<dialog
	bind:this={dialogElement}
	class="p-4 shadow-2xl rounded-lg bg-slate-900"
	on:click={dialogClickHandler}
	on:keydown={() => {}}
>
	{#if isOpen}
		<div
			class="flex flex-col items-center gap-4"
			transition:scale={{ duration: 200, delay: 0 }}
			on:introstart
			on:outroend
		>
			<h2 class="font-bold text-lg">Fund your Wallet</h2>

			<p>Send at least 5.5 AKT to</p>
			<code class="p-2 bg-slate-600 rounded-md">{wallet.getAddress()}</code>
		</div>
	{/if}
</dialog>
