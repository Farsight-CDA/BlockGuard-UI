export function base64ToUInt(base64: string) {
	var binary_string = window.atob(base64);
	var len = binary_string.length;
	var bytes = new Uint8Array(len);
	for (var i = 0; i < len; i++) {
		bytes[i] = binary_string.charCodeAt(i);
	}
	return bytes;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
export function toTimespanString(milliseconds: number) {
	if (milliseconds < MINUTE) {
		return `${Math.round(milliseconds / SECOND)} sec${
			milliseconds >= 2 * SECOND ? 's' : ''
		}`;
	} else if (milliseconds < HOUR) {
		return `${Math.round(milliseconds / MINUTE)} min${
			milliseconds >= 2 * MINUTE ? 's' : ''
		}`;
	} else if (milliseconds < DAY) {
		return `${Math.round(milliseconds / HOUR)} hour${
			milliseconds >= 2 * HOUR ? 's' : ''
		}`;
	} else {
		return `${Math.round(milliseconds / DAY)} day${
			milliseconds >= 2 * DAY ? 's' : ''
		}`;
	}
}

type AsyncFunction = (...params: any[]) => Promise<any>;
type ErrorHandler = (e: any) => void;

function noop<T>(result: T) {
	return result;
}

export function schedule<TFn extends AsyncFunction>(
	timeout: number,
	action: TFn
) {
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

export function retry<T>(
	attempt: () => Promise<T>,
	delays: number[],
	notify = noop
) {
	const addRetry = (promise: Promise<T>, delay: number) =>
		promise.catch(retryHandler(attempt, delay, notify));

	return delays.reduce(addRetry, attempt());
}
