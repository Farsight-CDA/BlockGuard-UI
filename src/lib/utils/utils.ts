export function base64ToUInt(base64: string) {
	var binary_string = window.atob(base64);
	var len = binary_string.length;
	var bytes = new Uint8Array(len);
	for (var i = 0; i < len; i++) {
		bytes[i] = binary_string.charCodeAt(i);
	}
	return bytes;
}

type AsyncFunction = (...params: any[]) => Promise<any>;
type ErrorHandler = (e: any) => void;

function noop<T>(result: T) {
	return result;
}

export function schedule<TFn extends AsyncFunction>(timeout: number, action: TFn) {
	return new Promise<ReturnType<TFn>>((resolve, reject) => {
		const fire = () => action().then(resolve, reject);
		setTimeout(fire, timeout);
	});
}

function retryHandler(fn: any, delay: number, notify: ErrorHandler) {
	const attempt = () => fn();

	return (e: any) => {
		notify(e);
		return schedule(delay, attempt);
	};
}

export function retry<T>(attempt: () => Promise<T>, delays: number[], notify = noop) {
	const addRetry = (promise: Promise<any>, delay: number) =>
		promise.catch(retryHandler(attempt, delay, notify));

	return delays.reduce(addRetry, attempt());
}
