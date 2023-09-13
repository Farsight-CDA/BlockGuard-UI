import { writable } from "svelte/store";

export interface NativeAPIs {
    loadFile(path: string, content: string): Promise<string>;
    saveFile(path: string, content: string): Promise<void>;
}

export const NATIVE_API = writable<NativeAPIs>(null!);

export function initializeNativeAPI() {
    //ToDo: Have runtime polyfill this
    NATIVE_API.set({
        loadFile: null!,
        saveFile: null!,
    });
}