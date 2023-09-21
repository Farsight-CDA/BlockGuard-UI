<script lang="ts">
	import { createCertificate } from '@playwo/akashjs/build/certificates';
	import StatusLamp, { StatusLampStatus } from './StatusLamp.svelte';
	import { onDestroy } from 'svelte';
	import FundWalletModal from './FundWalletModal.svelte';
	import type { CertificateInfo, Wallet } from '$lib/wallet/types';
	import { WALLET } from '$lib/wallet/wallet';
	import { useVPNClientStatus } from '$lib/vpn-manager/client-status';
	import type { VPNClientStatus } from '$lib/native-api/native-api';

	const vpnClientStatus = useVPNClientStatus();

	var wallet: Wallet = $WALLET!;
	$: wallet = $WALLET!;

	var balance = wallet.balance;
	var certificate = wallet.certificate;

	const READY_BALANCE = 10;
	const WARNING_BALANCE = 5.1;

	$: vpnClientLampStatus = getVPNClientStatus($vpnClientStatus);
	var vpnClientLampStatus = StatusLampStatus.Loading;

	$: fundsLampStatus = getFundsStatus($balance);
	var fundsLampStatus = getFundsStatus($balance);

	var certificationCreationPending: boolean = false;

	$: certificateLampStatus = getCertificateStatus(
		$certificate,
		certificationCreationPending
	);
	var certificateLampStatus = getCertificateStatus(
		$certificate,
		certificationCreationPending
	);

	let openFundWalletModal: () => Promise<void>;

	function getVPNClientStatus(status: VPNClientStatus | null) {
		switch (status) {
			case null:
				return StatusLampStatus.Loading;
			case 'Offline':
				return StatusLampStatus.Error;
			case 'Running':
				return StatusLampStatus.Ready;
		}
	}

	function getFundsStatus(balance: number) {
		if (balance >= READY_BALANCE) {
			return StatusLampStatus.Ready;
		} else if (balance >= WARNING_BALANCE) {
			return StatusLampStatus.Warning;
		} else {
			return StatusLampStatus.ActionRequired;
		}
	}

	function getCertificateStatus(
		certificate: CertificateInfo | null,
		isPending: boolean
	) {
		if (isPending) {
			return StatusLampStatus.Loading;
		} else if (certificate == null) {
			return StatusLampStatus.ActionRequired;
		} else {
			return StatusLampStatus.Ready;
		}
	}

	function getConnectionStatus() {}

	async function triggerUpdateCertificate() {
		try {
			certificationCreationPending = true;
			const cert = await createCertificate(wallet.getAddress());
			await wallet.broadcastCertificate(cert.csr, cert.publicKey);
			await WALLET.setCertificate(cert.csr, cert.publicKey, cert.privateKey);
		} finally {
			certificationCreationPending = false;
		}
	}
</script>

<FundWalletModal bind:open={openFundWalletModal}></FundWalletModal>

<div class="grid grid-cols-2 sm:grid-cols-3 gap-6 auto-rows-fr">
	<StatusLamp name="VPN Client" status={vpnClientLampStatus} />
	<StatusLamp
		name="Funds"
		status={fundsLampStatus}
		value={Math.round(100 * $balance) / 100}
		on:click={openFundWalletModal}
		clickable={true}
	/>
	<StatusLamp
		name="Certificate"
		status={certificateLampStatus}
		on:click={triggerUpdateCertificate}
		clickable={certificateLampStatus != StatusLampStatus.Ready &&
			!certificationCreationPending}
	/>
</div>
