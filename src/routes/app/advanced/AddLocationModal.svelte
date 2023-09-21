<script lang="ts">
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { DeploymentBid } from '$lib/types/types';
	import { useRequiredWallet } from '$lib/wallet/wallet';
	import VpnSdlUrl from '$static/vpn-sdl.txt';
	import { MsgCreateDeployment } from '@playwo/akashjs/build/protobuf/akash/deployment/v1beta3/deploymentmsg';
	import { SDL } from '@playwo/akashjs/build/sdl';
	import { scale } from 'svelte/transition';

	enum Progress {
		None,
		FetchingSDL,
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

		Cancelling
	}

	var sdl: SDL = null!;

	var progress: Progress = Progress.None;
	var dseq: number = 0;

	var refreshInterval: NodeJS.Timeout;

	var wallet = useRequiredWallet();

	var bids: DeploymentBid[] | null = null;

	let openInner: () => Promise<void>;
	export const open = async function open() {
		dseq = Math.round(Math.random() * 100000000);

		if (sdl == null) {
			progress = Progress.FetchingSDL;
		} else {
			progress = Progress.Deploying;
		}

		openInner();

		if (sdl == null) {
			const VpnSdlText = await fetch(VpnSdlUrl).then((x) => x.text());
			sdl = SDL.fromString(VpnSdlText, 'beta3');
			progress = Progress.Deploying;
		}

		await triggerCreateDeployment();
		progress = Progress.AwaitBids;
	};

	let closeInner: () => void;
	async function close() {
		switch (progress) {
			case Progress.Choosing:
			case Progress.SubmittingManifest:
				try {
					progress = Progress.Cancelling;
					await $wallet.closeDeployment(dseq);
				} catch (error) {}
			case Progress.None:
			case Progress.Completed:
				clearInterval(refreshInterval);
				closeInner();
				progress = Progress.None;
				return true;

			case Progress.Deploying:
			case Progress.Accepting:
			case Progress.AwaitBids: //Hard to estimate gas without bids
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
		refreshInterval = setInterval(refreshBids, 2000);
	}

	async function refreshBids() {
		bids = await $wallet.getDeploymentBids(dseq);

		if (progress == Progress.AwaitBids && bids.length > 0) {
			progress = Progress.Choosing;
		}
	}

	async function triggerAcceptBid(bid: DeploymentBid) {
		progress = Progress.Accepting;
		await $wallet.createLease(dseq, bid.gseq, bid.oseq, bid.provider);
		progress = Progress.SubmittingManifest;
		//Wait for provider to have block
		await new Promise((resolve) => setTimeout(resolve, 6500));
		await $wallet.submitManifest(dseq, bid.provider, sdl);
		progress = Progress.Completed;
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

		{#if progress == Progress.FetchingSDL}
			<p>Fetching SDL...</p>
			<LoadingSpinner></LoadingSpinner>
		{:else if progress == Progress.Deploying}
			<p>Creating Deployment...</p>
			<LoadingSpinner></LoadingSpinner>
		{:else if progress == Progress.AwaitBids}
			<p>Waiting for Bids...</p>
			<LoadingSpinner></LoadingSpinner>
		{:else if progress == Progress.Accepting}
			<p>Accepting Bid...</p>
			<LoadingSpinner></LoadingSpinner>
		{:else if progress == Progress.SubmittingManifest}
			<p>Submitting Manifest...</p>
			<LoadingSpinner></LoadingSpinner>
		{:else if progress == Progress.Cancelling}
			<p>Closing Deployment...</p>
			<LoadingSpinner></LoadingSpinner>
		{:else if (progress = Progress.Choosing)}
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
