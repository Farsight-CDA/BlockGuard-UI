import { NATIVE_API, type VPNClientStatus } from '$lib/native-api/native-api';
import { writable } from 'svelte/store';

export function useVPNClientStatus() {
	const { subscribe, set } = writable<VPNClientStatus | null>(null, () => {
		refreshStatus();
		const refreshInterval = setInterval(refreshStatus, 3000);
		return () => clearInterval(refreshInterval);
	});

	async function refreshStatus() {
		set(await NATIVE_API.getVPNClientStatus());
	}

	return {
		subscribe
	};
}
