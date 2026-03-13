import { SDL } from '@akashnetwork/chain-sdk/web';

export interface DeploymentManifest {
	groupSpecs: any[];
	sortedManifest: string;
	hash: Uint8Array;
}

export async function buildDeploymentManifest(
	sdl: string
): Promise<DeploymentManifest> {
	let parsedSDL: SDL;

	try {
		parsedSDL = SDL.fromString(sdl);
	} catch (error) {
		throw new Error(formatManifestError(error));
	}

	return {
		groupSpecs: parsedSDL.v3Groups(),
		sortedManifest: parsedSDL.manifestSortedJSON(),
		hash: await parsedSDL.manifestVersion()
	};
}

function formatManifestError(error: unknown) {
	if (error instanceof Error) {
		return error.message;
	}

	return 'Invalid Akash SDL.';
}
