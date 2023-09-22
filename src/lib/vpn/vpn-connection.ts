import { NATIVE_API } from '$lib/native-api/native-api';
import { writable } from 'svelte/store';
import type { VPNConnectionInfo } from './types';

const VPN_USERNAME = 'admin';
const VPN_PASSWORD = 'notreallyasecretpassword';

var VPN_CONNECTION: ReturnType<typeof createVPNConnection> | null =
	createVPNConnection();

export function useVPNConnection() {
	if (VPN_CONNECTION == null) {
		throw Error('VpnConnetion not initialized');
	}

	return VPN_CONNECTION;
}

function createVPNConnection() {
	const { subscribe, update, set } = writable<VPNConnectionInfo>(
		{
			isActive: false
		},
		() => {
			refreshStatus();
			const refreshInterval = setInterval(refreshStatus, 3000);
			return () => {
				clearInterval(refreshInterval);
			};
		}
	);

	async function refreshStatus() {
		const connectionStatus = await NATIVE_API.getConnectionStatus();
		var shouldKill = false;

		update((prev) => {
			if (prev.isActive) {
				prev.connection.status = connectionStatus.status;
			} else {
				shouldKill = true;
			}
			return prev;
		});

		if (
			(connectionStatus.status == 'Connected' ||
				connectionStatus.status == 'Connecting' ||
				connectionStatus.status == 'Failed') &&
			shouldKill
		) {
			await closeVPNConnection();
		}
	}

	async function connectVPNToLease(dseq: number, host: string) {
		set({
			isActive: true,
			connection: {
				dseq: dseq,
				status: 'Connecting'
			}
		});

		await NATIVE_API.connectVPN(host, VPN_USERNAME, VPN_PASSWORD);
	}

	async function closeVPNConnection() {
		update((prev) => {
			return {
				isActive: true,
				connection: prev.isActive
					? {
							dseq: prev.connection.dseq,
							status: 'Disconnecting'
					  }
					: null!
			};
		});

		await NATIVE_API.disconnectVPN();

		update(() => {
			return {
				isActive: false
			};
		});
	}

	return {
		subscribe,
		connectVPNToLease,
		closeVPNConnection
	};
}
