<script lang="ts">
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { DeploymentBid } from '$lib/types/types';
	import { retry } from '$lib/utils/utils';
	import { useRequiredWallet } from '$lib/wallet/wallet';
	import VPNSdlString from '$static/vpn-sdl.yaml';
	import { MsgCreateDeployment } from '@playwo/akashjs/build/protobuf/akash/deployment/v1beta3/deploymentmsg';
	import { SDL } from '@playwo/akashjs/build/sdl';
	import type { Writable } from 'svelte/store';
	import { scale } from 'svelte/transition';

	var wallet = useRequiredWallet();

	let averageBlockTime: Writable<number>;
	$: averageBlockTime = $wallet.averageBlockTime;

	$: blocksPerHour = 3600 / $averageBlockTime;

	enum DeploymentStep {
		None,
		//Wait for deployment tx
		Deploying,
		//Wait for bids to come in
		AwaitBids,
		//Wait for user selection
		Choosing,
		//Wait for bid accept tx
		Accepting,
		//Wait for manifest submission
		SubmittingManifest,
		//No more action needed, close asap
		Completed,

		Cancelling,

		Failed
	}
	interface DeploymentProgress {
		step: DeploymentStep;
		retries: number;
	}

	var wallet = useRequiredWallet();

	var sdl: SDL = SDL.fromString(VPNSdlString);

	var progress: DeploymentProgress = {
		step: DeploymentStep.None,
		retries: 0
	};

	var dseq: number = 0;

	var refreshInterval: NodeJS.Timeout;

	var bids: DeploymentBid[] | null = null;

	function setProgress(step: DeploymentStep) {
		progress = {
			step: step,
			retries: 0
		};
	}

	async function moveForward(
		targetStep: DeploymentStep,
		retries: number[],
		action: () => Promise<void>
	) {
		try {
			await retry(() => {
				progress.retries++;
				return action();
			}, retries);
			setProgress(targetStep);
		} catch (error) {
			setProgress(DeploymentStep.Failed);
			throw error;
		}
	}

	let openInner: () => Promise<void>;
	export const open = async function open() {
		dseq = Math.round(Math.random() * 100000000);
		setProgress(DeploymentStep.Deploying);

		openInner();

		await moveForward(
			DeploymentStep.AwaitBids,
			[6000],
			triggerCreateDeployment
		);

		await new Promise((resolve) => setTimeout(resolve, 3000));

		await moveForward(
			DeploymentStep.Choosing,
			[1000, 2000, 3000, 4000, 5000, 6000, 7000],
			triggerGatherBids
		);
	};

	let closeInner: () => void;
	async function close() {
		switch (progress.step) {
			case DeploymentStep.Choosing:
			case DeploymentStep.SubmittingManifest:
				try {
					setProgress(DeploymentStep.Cancelling);
					await $wallet.closeDeployment(dseq);
				} catch (error) {}
			case DeploymentStep.None:
			case DeploymentStep.Completed:
			case DeploymentStep.Cancelling:
			case DeploymentStep.Failed:
				clearInterval(refreshInterval);
				closeInner();
				setProgress(DeploymentStep.None);
				return true;

			case DeploymentStep.Deploying:
			case DeploymentStep.Accepting:
			case DeploymentStep.AwaitBids: //Hard to estimate gas without bids
				//Can't close now
				return false;
		}
	}

	async function triggerCreateDeployment() {
		const msg = MsgCreateDeployment.fromPartial({
			deposit: {
				denom: 'uakt',
				amount: '5000000'
			},
			version: await sdl.manifestVersion(),
			depositor: $wallet.getAddress(),
			id: {
				owner: $wallet.getAddress(),
				dseq: dseq
			},
			groups: sdl.v3Groups()
		});

		await $wallet.createDeplyoment(msg);
	}

	async function triggerGatherBids() {
		bids = await $wallet.getDeploymentBids(dseq);

		if (bids.length == 0) {
			throw Error('No bids received');
		}
	}

	async function triggerAcceptBid(bid: DeploymentBid) {
		setProgress(DeploymentStep.Accepting);

		await moveForward(DeploymentStep.SubmittingManifest, [6000], () =>
			$wallet.createLease(dseq, bid.gseq, bid.oseq, bid.provider)
		);
		await moveForward(
			DeploymentStep.Completed,
			Array.from(Array(15).keys()).map((x) => 1000),
			() => $wallet.submitManifest(dseq, bid.provider, sdl)
		);

		await close();
	}

	function shortenString(str: string | null) {
		if (str == null) {
			return '';
		}
		if (str.length <= 11) {
			return str;
		}
		return str.slice(0, 4) + '...' + str.slice(str.length - 4, str.length);
	}

	enum PriceMode {
		PerHour,
		PerDolar
	}

	var priceMode: PriceMode = PriceMode.PerHour;

	function changePriceMode() {
		priceMode = (priceMode + 1) % 2;
	}

	function niceFlore(x: number, digits: number = 4) {
		const y = Math.pow(10, digits);
		return Math.floor(x * y) / y;
	}
</script>

<Modal bind:open={openInner} bind:close={closeInner}>
	<div
		class="flex flex-col items-center gap-4"
		transition:scale={{ duration: 200, delay: 0 }}
		on:introstart
		on:outroend
	>
		<h2 class="font-bold text-lg">Add Active Location</h2>

		{#if progress.step == DeploymentStep.Deploying}
			<p>Creating Deployment...</p>
			<LoadingSpinner></LoadingSpinner>
			<p>Attempt: {progress.retries}</p>
		{:else if progress.step == DeploymentStep.AwaitBids}
			<p>Waiting for Bids...</p>
			<LoadingSpinner></LoadingSpinner>
			<p>Attempt: {progress.retries}</p>
		{:else if progress.step == DeploymentStep.Accepting}
			<p>Accepting Bid...</p>
			<LoadingSpinner></LoadingSpinner>
			<p>Attempt: {progress.retries}</p>
		{:else if progress.step == DeploymentStep.SubmittingManifest}
			<p>Submitting Manifest...</p>
			<LoadingSpinner></LoadingSpinner>
			<p>Attempt: {progress.retries}</p>
		{:else if progress.step == DeploymentStep.Cancelling}
			<p>Closing Deployment...</p>
			<LoadingSpinner></LoadingSpinner>
			<p>Attempt: {progress.retries}</p>
		{:else if progress.step == DeploymentStep.Failed}
			<p>Failed!</p>
		{:else if progress.step == DeploymentStep.Choosing}
			<p>Choose your provider</p>

			<table>
				<thead>
					<tr class="text-sm md:text-xs">
						<th> Location </th>
						<th> Provider </th>
						<th>
							<button on:click={changePriceMode}>
								Price {#if priceMode == PriceMode.PerHour}
									$/hr
								{:else}
									$/d
								{/if}</button
							>
						</th>

						<th> Speed </th>
						<th> Actions </th>
					</tr>
				</thead>
				<tbody class="text-center text-sm p-1 rounded-md">
					{#if bids != null}
						{#each bids as bid}
							<!-- svelte-ignore empty-block -->
							{#await $wallet.getProviderDetails(bid.provider) then details}
								<tr>
									<td>
										<p>{details.region}</p>
										<p class="text-xs">({details.country}, {details.city})</p>
									</td>
									<td>
										{shortenString(details.organization)}
										{shortenString(details.website)}
									</td><td>
										{#if priceMode == PriceMode.PerHour}
											{niceFlore(
												(bid.price * 3600000) / $averageBlockTime / 1000000,
												5
											)} $/h
										{:else if priceMode == PriceMode.PerDolar}
											1$ for
											{niceFlore(
												1 /
													((bid.price * 3600000) / $averageBlockTime / 1000000),
												3
											)} hr
										{/if}
									</td>
									<td>
										<p class="after:content-['_↑']">
											{details.networkDownload}
										</p>
										<p class="after:content-['_↓']">
											{details.networkUpload}
										</p>
									</td>
									<td>
										<button
											class={'bg-slate-950 border border-gray-700  rounded-full px-3 py-1'}
											on:click={() => triggerAcceptBid(bid)}
										>
											Select
										</button>
									</td>
								</tr>
							{/await}
						{/each}
					{/if}
				</tbody>
			</table>
		{/if}
	</div>
</Modal>
