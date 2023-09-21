import { NATIVE_API } from '$lib/native-api/native-api';
import { writable } from 'svelte/store';
import type { VPNConnectionInfo } from './types';

const VPN_USERNAME = 'admin';
const VPN_PASSWORD = 'notreallyasecretpassword';

export function useVPNConnection() {
	const { subscribe, update, set } = writable<VPNConnectionInfo>(
		{
			isActive: false
		},
		() => {
			console.log('NEW CONNECTIONSTATUS');
			refreshStatus();
			const refreshInterval = setInterval(refreshStatus, 3000);
			return () => {
				clearInterval(refreshInterval);
				console.log('KILLED CONNECTIONSTATUS');
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
				connectionStatus.status == 'Connecting') &&
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
				isActive: prev.isActive,
				connection: prev.isActive
					? {
							dseq: prev.connection.dseq,
							status: 'Disconnecting'
					  }
					: null!
			};
		});
	}

	return {
		subscribe,
		connectVPNToLease,
		closeVPNConnection
	};
}
