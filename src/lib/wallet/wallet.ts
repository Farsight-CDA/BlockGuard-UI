import { NATIVE_API } from "$lib/native-api/native-api";
import { writable } from "svelte/store";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing"
import { SigningStargateClient } from "@cosmjs/stargate" 
import { Registry, type EncodeObject } from "@cosmjs/proto-signing";
import { getAkashTypeRegistry } from "@akashnetwork/akashjs/build/stargate";

export interface Wallet {
    getAddress(): string;
    getMnemonic(): string;
    messageTx(message: EncodeObject): Promise<void>;
}

const WALLET_STORAGE_FILE = "wallet.json";

export const WALLET = writable<Wallet | null>(null);
var wallet: CosmJSWallet | null = null;

//Tries to load wallet from storage, if not found does nothing
export async function initializeWallet() {
    const content = await NATIVE_API.loadFile(WALLET_STORAGE_FILE);

    if (content == null) {
        return;
    }

    const cosmJSWallet = await decodeWallet(content);
    
    WALLET.set(cosmJSWallet);
    wallet = cosmJSWallet;
    
    return true;
}

async function storeCurrentWallet() {
    if (wallet == null){
        throw "Failed to save wallet, none is currently set!";
    }

    const encodedWallet = await encodeCosmJSWallet(wallet);
    NATIVE_API.saveFile(WALLET_STORAGE_FILE, encodedWallet);
}

export async function setWallet(mnemonic: string) {
    const hdWallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: "akash" });
    const cosmJSWallet = new CosmJSWallet(hdWallet, 'https://akash-rpc.polkachu.com:443');
    await cosmJSWallet.initialize();

    WALLET.set(cosmJSWallet);
    wallet = cosmJSWallet;
    await storeCurrentWallet();
}

export async function generateMnemonics() {
    return (await DirectSecp256k1HdWallet.generate(24)).mnemonic;
}

interface StoredWallet {
    wallet: string;
    rpcEndpoint: string;
}
const ENCRYPTION_PASSWORD = "123456789";

async function encodeCosmJSWallet(wallet: CosmJSWallet) {
    return JSON.stringify({
        wallet: await wallet.serialize(ENCRYPTION_PASSWORD),
        rpcEndpoint: wallet.getRPCUrl()
    } satisfies StoredWallet);
}

function decodeWallet(content: string) {
    const storedWallet = JSON.parse(content) as StoredWallet;
    return CosmJSWallet.deserialize(storedWallet, ENCRYPTION_PASSWORD);
}

class CosmJSWallet implements Wallet {
    private wallet: DirectSecp256k1HdWallet;
    private client: SigningStargateClient;
    private address: string;
    private rpcUrl: string;

    constructor(wallet: DirectSecp256k1HdWallet, rpcUrl: string) {
        this.wallet = wallet;
        this.address = null!;
        this.rpcUrl = rpcUrl;
        this.client = null!;
    }

    async initialize(): Promise<void> {
        this.address = (await this.wallet.getAccounts())[0].address;
        this.client = await SigningStargateClient.connectWithSigner(this.rpcUrl, this.wallet, {
            registry: new Registry(getAkashTypeRegistry()) as any
        });
    }

    getAddress(): string {
        return this.address;
    }

    getMnemonic(): string {
        return this.wallet.mnemonic;
    }

    getRPCUrl() : string {
        return this.rpcUrl;
    }

    async messageTx(message: EncodeObject): Promise<void> {
        await this.client.signAndBroadcast(this.address, [message], "auto", "blockguard");
    }

    async serialize(password: string) {
        return this.wallet.mnemonic; //this.wallet.serialize(password);
    }

    static async deserialize(storedWallet: StoredWallet, password: string) {
        const hdWallet = await DirectSecp256k1HdWallet.fromMnemonic(storedWallet.wallet, { prefix: "akash" }); //await DirectSecp256k1HdWallet.deserialize(content, password);
        const cosmJsWallet = new CosmJSWallet(hdWallet, storedWallet.rpcEndpoint);
        await cosmJsWallet.initialize();
        return cosmJsWallet;
    }
}