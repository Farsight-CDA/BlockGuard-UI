<script lang="ts">
	import {
		WALLET,
		setNewCertificate,
		type Wallet,
		type CertificateInfo
	} from '$lib/wallet/wallet';
	import { createCertificate } from '@playwo/akashjs/build/certificates';
	import StatusLamp, { StatusLampStatus } from './StatusLamp.svelte';
	import { onDestroy } from 'svelte';
	import { NATIVE_API } from '$lib/native-api/native-api';
	import FundWalletModal from './FundWalletModal.svelte';

	var wallet: Wallet = $WALLET!;
	$: wallet = $WALLET!;

	var balance = wallet.balance;
	var certificate = wallet.certificate;

	const READY_BALANCE = 10;
	const WARNING_BALANCE = 5.1;

	const refreshInterval = setInterval(
		async () => (vpnClientStatus = await getVPNClientStatus()),
		4000
	);

	var vpnClientStatus = StatusLampStatus.Loading;

	$: fundsStatus = getFundsStatus($balance);
	var fundsStatus = getFundsStatus($balance);

	var certificationCreationPending: boolean = false;

	$: certificateStatus = getCertificateStatus(
		$certificate,
		certificationCreationPending
	);
	var certificateStatus = getCertificateStatus(
		$certificate,
		certificationCreationPending
	);

	let openFundWalletModal: () => Promise<void>;

	async function getVPNClientStatus() {
		const status = await NATIVE_API.vpnClientStatus();

		switch (status) {
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

	async function triggerUpdateCertificate() {
		try {
			certificationCreationPending = true;
			const cert = await createCertificate(wallet.getAddress());
			await wallet.broadcastCertificate(cert.csr, cert.publicKey);
			await setNewCertificate(cert.csr, cert.publicKey, cert.privateKey);
		} finally {
			certificationCreationPending = false;
		}
	}

	onDestroy(() => {
		clearInterval(refreshInterval);
	});
</script>

<FundWalletModal bind:open={openFundWalletModal}></FundWalletModal>

<div class="grid grid-cols-3 gap-6">
	<StatusLamp name="VPN Client" status={vpnClientStatus} />
	<StatusLamp
		name="Funds"
		status={fundsStatus}
		value={$balance}
		on:click={openFundWalletModal}
		clickable={true}
	/>
	<StatusLamp
		name="Certificate"
		status={certificateStatus}
		on:click={triggerUpdateCertificate}
		clickable={true ||
			(certificateStatus != StatusLampStatus.Ready &&
				!certificationCreationPending)}
	/>
</div>
