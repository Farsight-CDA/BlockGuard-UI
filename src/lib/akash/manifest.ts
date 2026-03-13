import {
	generateManifest,
	generateManifestVersion,
	manifestToSortedJSON
} from '@akashnetwork/chain-sdk/web';

export interface DeploymentManifest {
	groupSpecs: any[];
	sortedManifest: string;
	hash: Uint8Array;
}

export async function buildDeploymentManifest(
	sdl: string
): Promise<DeploymentManifest> {
	const generatedManifest = generateManifest(sdl);

	if (generatedManifest.ok !== true) {
		throw new Error(formatManifestError(generatedManifest.value));
	}

	return {
		groupSpecs: generatedManifest.value.groupSpecs,
		sortedManifest: manifestToSortedJSON(generatedManifest.value.groups),
		hash: await generateManifestVersion(generatedManifest.value.groups)
	};
}

function formatManifestError(
	errors: Array<{ instancePath?: string; message?: string }>
) {
	const firstError = errors[0];

	if (firstError == null) {
		return 'Invalid Akash SDL.';
	}

	const location =
		firstError.instancePath != null && firstError.instancePath.length > 0
			? firstError.instancePath
			: 'SDL';

	return `${location}: ${firstError.message ?? 'invalid Akash SDL.'}`;
}
