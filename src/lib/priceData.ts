import { writable } from 'svelte/store';

interface PriceData {
	akt: number;
}

var PRICE_DATA: ReturnType<typeof createPriceData> | null;

export function useCurrentPrices() {
	if (PRICE_DATA == null) {
		throw Error('PRICE_DATA not initialized');
	}

	return PRICE_DATA!;
}

//Tries to load config from storage, if not found does nothing
export async function initializePriceData() {
	PRICE_DATA = createPriceData();

	try {
		await PRICE_DATA.initialize();
	} catch (error) {
		return false;
	}

	return true;
}

function createPriceData() {
	const { subscribe, update } = writable<PriceData>(
		{ akt: 0 },
		() => () => dispose()
	);
	var initialized = false;

	let interval: NodeJS.Timeout | null = null;

	async function initialize() {
		refresh();
		interval = setInterval(refresh, 30000);
	}

	async function refresh() {
		const price = await getCurrentPrice();
		update((data) => {
			data.akt = price;
			return data;
		});
	}

	function dispose() {
		if (interval != null) {
			clearInterval(interval!);
		}
	}

	async function getCurrentPrice() {
		try {
			const response = await fetch(
				`https://api.coingecko.com/api/v3/simple/price?ids=akash-network&vs_currencies=usd`
			);

			// Check if the response is successful
			if (response.status === 200) {
				let res = await response.json();
				return res['akash-network']['usd'];
			} else {
				console.error('Failed to fetch cryptocurrency price data.');
			}
		} catch (error) {
			console.error('An error occurred:', error);
		}
		return null;
	}

	return {
		subscribe,
		initialize
	};
}

const DEFAULT_GLOBAL_CONFIG = {
	useAdvancedMode: true,
	useBubbleMode: false,
	rpcUrl: 'https://rpc-akash.ecostake.com:443'
} satisfies Prices;
