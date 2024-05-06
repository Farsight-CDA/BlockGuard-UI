import { type Invalidator, type Subscriber, writable } from 'svelte/store';
import { SDL } from '@leonmw/akashjs/build/sdl';
import VPNSdlString from '$static/vpn-sdl.yaml';

let UserSDL: ReturnType<typeof createUserSDL> | null = null;

export function useRequiredUserSDL() {
	return {
		subscribe: (
			run: Subscriber<SDL>,
			invalidate?: Invalidator<SDL> | undefined
		) => {
			if (UserSDL == null) {
				throw Error('SDL not initialized');
			}

			return UserSDL.subscribe(
				(price) => {
					if (price == null) {
						throw Error('SDL required but not set');
					}
					run(price!);
				},
				(value) => {
					if (value == null) {
						throw Error('SDL required but not set');
					}
					invalidate?.(value!);
				}
			);
		}
	};
}

export function initializeUserSDL(user?: string, password?: string) {
	UserSDL = createUserSDL();
	return UserSDL.initialize(user, password);
}

function createUserSDL() {
	const { subscribe, set } = writable<SDL>();

	function initialize(user?: string, password?: string) {
		if (user == null || password == null) {
			console.log('no user or password');
			return false;
		}
		let replace = VPNSdlString.replace('PLACEHOLDER_USER', user);
		replace = replace.replace('PLACEHOLDER_PASSWORD', password);
		set(SDL.fromString(replace));

		return true;
	}

	return {
		subscribe,
		initialize
	};
}
