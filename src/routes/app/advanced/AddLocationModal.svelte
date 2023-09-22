<script lang="ts">
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { DeploymentBid } from '$lib/types/types';
	import { retry } from '$lib/utils/utils';
	import { useRequiredWallet } from '$lib/wallet/wallet';
	import VPNSdlString from '$static/vpn-sdl.yaml';
	import { MsgCreateDeployment } from '@playwo/akashjs/build/protobuf/akash/deployment/v1beta3/deploymentmsg';
	import { SDL } from '@playwo/akashjs/build/sdl';
	import { scale } from 'svelte/transition';

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
					<tr>
						<th> Location </th>
						<th> Provider </th>
						<th> Price </th>
						<th> Speed </th>
						<th> Actions </th>
					</tr>
				</thead>
				<tbody class="text-center">
					{#if bids != null}
						{#each bids as bid}
							<!-- svelte-ignore empty-block -->
							{#await $wallet.getProviderDetails(bid.provider) then details}
								<tr>
									<td>
										{details.region} ({details.country}, {details.city})
									</td>
									<td>
										{details.organization}
										{details.website}
									</td><td>
										{bid.price} uakt / block
									</td>
									<td>
										<p>DOWN: {details.networkDownload}</p>
										<p>UP: {details.networkUpload}</p>
									</td>
									<td>
										<button on:click={() => triggerAcceptBid(bid)}>
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
