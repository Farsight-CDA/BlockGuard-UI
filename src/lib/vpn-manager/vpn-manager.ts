import { NATIVE_API } from '$lib/native-api/native-api';
import { writable } from 'svelte/store';
import type { VPNConnectionInfo } from './types';

const VPN_USERNAME = 'admin';
const VPN_PASSWORD = 'notreallyasecretpassword';

export const VPN_MANAGER = useVPNConnectionManager();

export function useVPNConnectionManager() {
	const { subscribe, update, set } = writable<VPNConnectionInfo>({
		isActive: false
	});

	const refreshInterval = setInterval(refreshStatus, 3000);

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

	function dispose() {
		clearInterval(refreshInterval);
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

		await NATIVE_API.disconnectVPN();

		set({
			isActive: false
		});
	}

	return {
		subscribe,
		connectVPNToLease,
		closeVPNConnection,
		dispose
	};
}
