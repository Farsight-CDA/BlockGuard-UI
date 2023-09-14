import { writable } from "svelte/store";

export interface NativeAPIs {
    loadFile(path: string): Promise<string | null>;
    saveFile(path: string, content: string): Promise<void>;
}

export var NATIVE_API: NativeAPIs = null!;

export async function initializeNativeAPI() {
    //ToDo: Have runtime polyfill this
    NATIVE_API = {
        loadFile: (path) => Promise.resolve(localStorage.getItem(path)),
        saveFile: (path, content) => Promise.resolve(localStorage.setItem(path, content)),
    };
    
    return true;
}