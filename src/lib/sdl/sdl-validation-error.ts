export class SdlValidationError extends Error {
	static assert(condition: unknown, message: string): asserts condition {
		if (!condition) {
			throw new SdlValidationError(message);
		}
	}

	constructor(message: string) {
		super(message);
		this.name = 'SdlValidationError';
	}
}
