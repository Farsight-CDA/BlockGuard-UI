import type { CertificateInfo, Wallet } from "./wallet";

import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing"
import type { SigningStargateClient, ProtobufRpcClient } from "@cosmjs/stargate" 
import { messages } from "@playwo/akashjs/build/stargate"
import { getQueryClient, getMsgClient } from "@playwo/akashjs/build/rpc/index"
import { base64ToUInt } from "$lib/utils/utils";
import { toBase64 } from "pvutils"
import type { pems } from "@playwo/akashjs/build/certificates";
import { writable, type Writable } from "svelte/store";
import type { MsgCreateDeployment } from "@playwo/akashjs/build/protobuf/akash/deployment/v1beta3/deploymentmsg";
import { QueryClientImpl as DeploymentQueryClient, QueryDeploymentResponse, QueryDeploymentsResponse } from "@playwo/akashjs/build/protobuf/akash/deployment/v1beta3/query";
import { MsgCreateCertificate } from "@playwo/akashjs/build/protobuf/akash/cert/v1beta1/cert";
import { QueryDeploymentsRequest } from "@playwo/akashjs/build/protobuf/akash/deployment/v1beta3/query"
import { DeployedRemote } from "$lib/types/types";
import { Deployment_State } from "@playwo/akashjs/build/protobuf/akash/deployment/v1beta3/deployment";

interface StoredWallet {
    mnemonics: string;
    rpcEndpoint: string;
    certificate: string | null;
}

const GAS_PRICE = 2500 / 100000;

export class CosmJSWallet implements Wallet {
    private wallet: DirectSecp256k1HdWallet;
    private address: string;
    private rpcUrl: string;

    private msgClient: SigningStargateClient;
    private queryClient: ProtobufRpcClient;

    private initialized: boolean;
    private refreshTimeout: NodeJS.Timeout;

    public certificate: Writable<CertificateInfo | null>;
    private _certificate: CertificateInfo | null;
    public balance: Writable<number>;
    public remotes: Writable<DeployedRemote[]>;

    private blockTimestampCache: Map<number, Date>;

    constructor(wallet: DirectSecp256k1HdWallet, rpcUrl: string, certificate: CertificateInfo | null) {
        this.wallet = wallet;
        this.address = null!;
        this.rpcUrl = rpcUrl;

        this.msgClient = null!;   
        this.queryClient = null!;
        this.initialized = false;

        this._certificate = certificate;
        this.certificate = writable<CertificateInfo | null>(certificate);
        this.balance = writable<number>(0);
        this.remotes = writable<DeployedRemote[]>([]);

        this.blockTimestampCache = new Map<number, Date>();

        this.refreshTimeout = setInterval(this.refresh.bind(this), 3000);
        console.log("ADDED - " + this.refreshTimeout)
    }
    
//Getters

    getAddress(): string {
        return this.address;
    }

    getMnemonic(): string {
        return this.wallet.mnemonic;
    }

    getRPCUrl() : string {
        return this.rpcUrl;
    }

    async getBlockTimestamp(height: number): Promise<Date> {
        var date = this.blockTimestampCache.get(height);

        if (date != null) {
            return date;
        }

        const block = await this.msgClient.getBlock(height);
        date = new Date(block.header.time);
        this.blockTimestampCache.set(height, date);
        return date;
    }
    
    //Transactions

    async broadcastCertificate({ csr, publicKey }: pems): Promise<void> {  
        const encodedCsr = base64ToUInt(toBase64(csr!));
        const encdodedPublicKey = base64ToUInt(toBase64(publicKey!));
        
        const message = createStarGateMessage(messages.MsgCreateCertificate, 
            MsgCreateCertificate.fromPartial({
                owner: this.address,
                cert: encodedCsr,
                pubkey: encdodedPublicKey,
            }));

        await this.msgClient.signAndBroadcast(this.address, [message.message], message.fee);
    }

    async createDeplyoment(msg: MsgCreateDeployment): Promise<void> {
        const message = createStarGateMessage(messages.MsgCreateDeployment, msg);
        const gas = Math.ceil(1.50 * await this.msgClient.simulate(this.address, [message.message], message.memo));
        
        message.fee.gas = gas.toString();
        message.fee.amount[0].amount = Math.ceil(GAS_PRICE * gas).toString();

        await this.msgClient.signAndBroadcast(this.address, [message.message], message.fee, message.memo);
    }

    //Internal

    setCertificate(certificate: CertificateInfo) {
        this.certificate.set(certificate);
        this._certificate = certificate;
    }

    private async loadCurrentBalance(): Promise<number> {
        return parseInt((await this.msgClient.getBalance(this.address, "uakt")).amount) / 1000000;
    }

    private async loadCurrentDeployments(): Promise<QueryDeploymentResponse[]> {
        const request = QueryDeploymentsRequest.fromPartial({
            filters: {
                owner: this.address,
                state: Deployment_State[Deployment_State.active]
            }
        })

        const res = await new DeploymentQueryClient(this.queryClient).Deployments(request);
        return res.deployments;
    }

    //Lifetime

    async initialize(): Promise<void> {
        this.address = (await this.wallet.getAccounts())[0].address;

        this.msgClient = await getMsgClient(this.rpcUrl, this.wallet);
        this.queryClient = await getQueryClient(this.rpcUrl);

        this.initialized = true;
        await this.refresh();
    }

    async refresh() {
        if (!this.initialized) {
            return;
        }

        const newBalance = await this.loadCurrentBalance();
        this.balance.set(newBalance);

        const newDeployments = await this.loadCurrentDeployments();
        this.remotes.set(newDeployments.map(d => DeployedRemote.fromDeploymentInfo(d)));
    }

    dispose() {
        console.log("Cleared - " + this.refreshTimeout);
        clearInterval(this.refreshTimeout);
    }

    //Serialization

    async serialize() {
        const storedWallet = {
            mnemonics: this.wallet.mnemonic,
            rpcEndpoint: this.rpcUrl,
            certificate: this._certificate != null 
                ? JSON.stringify(this._certificate) as string
                : null
        } satisfies StoredWallet;

        return JSON.stringify(storedWallet);
    }

    static async deserialize(content: string) {
        const storedWallet = JSON.parse(content) as StoredWallet;

        const hdWallet = await DirectSecp256k1HdWallet.fromMnemonic(storedWallet.mnemonics, { prefix: "akash" }); 
        const certificate = storedWallet.certificate != null 
            ? JSON.parse(storedWallet.certificate) as CertificateInfo
            : null;
            
        const cosmJsWallet = new CosmJSWallet(hdWallet, storedWallet.rpcEndpoint, certificate);
        await cosmJsWallet.initialize();
        return cosmJsWallet;
    }
}

function createStarGateMessage(message: messages, messageBody: any) {
    return {
        message: {
            typeUrl: message,
            value: messageBody,
        },
        fee: {
            amount: [
                {
                denom: "uakt",
                amount: "2500",
                },
            ],
            gas: "100000",
        },
        memo: "BlockGuard"
    };
}