<script lang="ts">
	import type { VPNClientStatus } from '$lib/native-api/native-api';
	import { useVPNClientStatus } from '$lib/vpn/client-status';
	import type { VPNConnectionInfo } from '$lib/vpn/types';
	import { useVPNConnection } from '$lib/vpn/vpn-connection';
	import type { CertificateInfo } from '$lib/wallet/types';
	import { useRequiredWallet } from '$lib/wallet/wallet';
	import { createCertificate } from '@playwo/akashjs/build/certificates';
	import FundWalletModal from './FundWalletModal.svelte';
	import StatusLamp, { StatusLampStatus } from './StatusLamp.svelte';

	const vpnClientStatus = useVPNClientStatus();
	const vpnConnection = useVPNConnection();

	var wallet = useRequiredWallet();

	var balance = $wallet.balance;
	var certificate = $wallet.certificate;

	const READY_BALANCE = 10;
	const WARNING_BALANCE = 5.1;
	const CERTIFICATE_CLICKABLE_BALANCE = 0.05;

	export let vpnClientLampStatus: StatusLampStatus = StatusLampStatus.Loading;
	$: vpnClientLampStatus = convertVPNClientStatus($vpnClientStatus);

	export let fundsLampStatus: StatusLampStatus = convertFundsStatus($balance);
	$: fundsLampStatus = convertFundsStatus($balance);

	var certificationCreationPending: boolean = false;

	export let certificateLampStatus: StatusLampStatus = convertCertificateStatus(
		$certificate,
		$balance,
		certificationCreationPending
	);
	$: certificateLampStatus = convertCertificateStatus(
		$certificate,
		$balance,
		certificationCreationPending
	);

	export let connectionLampStatus: StatusLampStatus = StatusLampStatus.Loading;
	$: connectionLampStatus = convertConnectionLampStatus($vpnConnection);

	let openFundWalletModal: () => Promise<void>;

	function convertVPNClientStatus(status: VPNClientStatus | null) {
		switch (status) {
			case null:
				return StatusLampStatus.Loading;
			case 'Offline':
				return StatusLampStatus.Error;
			case 'Running':
				return StatusLampStatus.Ready;
		}
	}

	function convertFundsStatus(balance: number) {
		if (balance >= READY_BALANCE) {
			return StatusLampStatus.Ready;
		} else if (balance >= WARNING_BALANCE) {
			return StatusLampStatus.Warning;
		} else {
			return StatusLampStatus.ActionRequired;
		}
	}

	function convertCertificateStatus(
		certificate: CertificateInfo | null,
		balance: number,
		isPending: boolean
	) {
		if (isPending) {
			return StatusLampStatus.Loading;
		} else if (balance < CERTIFICATE_CLICKABLE_BALANCE) {
			return StatusLampStatus.Error;
		} else if (certificate == null) {
			return StatusLampStatus.ActionRequired;
		} else {
			return StatusLampStatus.Ready;
		}
	}

	function convertConnectionLampStatus(connectionInfo: VPNConnectionInfo) {
		if (
			!connectionInfo.isActive ||
			(connectionInfo.isActive && connectionInfo.connection.status == 'Offline')
		) {
			return StatusLampStatus.Error;
		} else if (connectionInfo.connection.status == 'Connected') {
			return StatusLampStatus.Ready;
		} else if (
			connectionInfo.connection.status == 'Disconnecting' ||
			connectionInfo.connection.status == 'Connecting'
		) {
			return StatusLampStatus.Loading;
		}

		return StatusLampStatus.Error;
	}

	async function triggerUpdateCertificate() {
		try {
			certificationCreationPending = true;
			const cert = await createCertificate($wallet.getAddress());
			console.log('Created');
			await $wallet.broadcastCertificate(cert.csr, cert.publicKey);
			console.log('Broadcasted');
			await wallet.setCertificate(cert.csr, cert.publicKey, cert.privateKey);
			console.log('SET');
		} finally {
			certificationCreationPending = false;
		}
	}
</script>

<FundWalletModal bind:open={openFundWalletModal}></FundWalletModal>

<div class="w-full grid grid-cols-2 md:grid-cols-4 gap-6 auto-rows-fr">
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
			!certificationCreationPending &&
			$balance >= 0.02}
	/>
	<StatusLamp name="Connection" status={connectionLampStatus} />
</div>
