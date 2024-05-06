import { type Invalidator, type Subscriber, writable } from 'svelte/store';
import type { Wallet } from '$lib/wallet/types';

interface AktPrice {
	usd: number;
}

let AKT_PRICE: ReturnType<typeof createPriceDataStore> | null = null;

export function useRequiredAktPrice() {
	return {
		...AKT_PRICE,
		subscribe: (
			run: Subscriber<AktPrice>,
			invalidate?: Invalidator<AktPrice> | undefined
		) => {
			if (AKT_PRICE == null) {
				throw Error('AKT_PRICE not initialized');
			}

			return AKT_PRICE.subscribe(
				(price) => {
					if (price == null) {
						throw Error('AKT_PRICE required but not set');
					}
					run(price!);
				},
				(price) => {
					if (price == null) {
						throw Error('AKT_PRICE required but not set');
					}
					invalidate?.(price!);
				}
			);
		}
	};
}

//Tries to load config from storage, if not found does nothing
export async function initializeAktPrice() {
	AKT_PRICE = createPriceDataStore();
	return await AKT_PRICE.initialize();
}

function createPriceDataStore() {
	const { subscribe, update, set } = writable<AktPrice>(
		{ usd: 0 },
		() => () => dispose()
	);

	let interval: NodeJS.Timeout | null = null;

	async function initialize() {
		const price = await getCurrentPrice();

		if (price == null) {
			return false;
		}

		set({ usd: price });
		return true;
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
				const res = await response.json();
				return parseFloat(res['akash-network']['usd']);
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
