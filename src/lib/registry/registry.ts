import type { GeneratedType } from '@cosmjs/proto-signing';

class Writer {
	private buffer: number[] = [];

	writeVarint(value: bigint | number | string): this {
		let current =
			typeof value == 'bigint'
				? value
				: BigInt(typeof value == 'string' ? value : Math.trunc(value));

		while (current >= 0x80n) {
			this.buffer.push(Number(current & 0x7fn) | 0x80);
			current >>= 7n;
		}

		this.buffer.push(Number(current));
		return this;
	}

	writeUint32(value: number): this {
		return this.writeVarint(value);
	}

	writeString(value: string): this {
		const bytes = new TextEncoder().encode(value);
		this.writeBytes(bytes);
		return this;
	}

	writeBytes(value: Uint8Array): this {
		this.writeVarint(value.length);
		for (const byte of value) {
			this.buffer.push(byte);
		}
		return this;
	}

	writeMessage(fieldNumber: number, bytes: Uint8Array): this {
		this.writeUint32((fieldNumber << 3) | 2);
		this.writeBytes(bytes);
		return this;
	}

	finish(): Uint8Array {
		return new Uint8Array(this.buffer);
	}

	static create() {
		return new Writer();
	}
}

function createMessageType(
	encoder: (message: any, writer: Writer) => void
): GeneratedType {
	return {
		encode(message: any, writer?: any) {
			const internalWriter = writer ?? Writer.create();
			encoder(message, internalWriter);
			return internalWriter;
		},
		decode(data: any) {
			return data;
		},
		create(properties?: any) {
			return properties ?? {};
		},
		fromPartial(object: any) {
			return object ?? {};
		}
	};
}

function encodeMsgCreateCertificate(message: any, writer: Writer) {
	if (message.owner) {
		writer.writeUint32((1 << 3) | 2).writeString(message.owner);
	}

	if (message.cert?.length > 0) {
		writer.writeUint32((2 << 3) | 2).writeBytes(message.cert);
	}

	if (message.pubkey?.length > 0) {
		writer.writeUint32((3 << 3) | 2).writeBytes(message.pubkey);
	}
}

function encodeMsgRevokeCertificate(message: any, writer: Writer) {
	if (message.id) {
		const idWriter = Writer.create();
		encodeCertificateId(message.id, idWriter);
		writer.writeMessage(1, idWriter.finish());
	}
}

function encodeMsgCreateDeployment(message: any, writer: Writer) {
	if (message.id) {
		const idWriter = Writer.create();
		encodeDeploymentId(message.id, idWriter);
		writer.writeMessage(1, idWriter.finish());
	}

	for (const group of message.groups ?? []) {
		const groupWriter = Writer.create();
		encodeGroupSpec(group, groupWriter);
		writer.writeMessage(2, groupWriter.finish());
	}

	if (message.hash?.length > 0) {
		writer.writeUint32((3 << 3) | 2).writeBytes(message.hash);
	}

	if (message.deposit) {
		const depositWriter = Writer.create();
		encodeDeposit(message.deposit, depositWriter);
		writer.writeMessage(4, depositWriter.finish());
	}
}

function encodeMsgCloseDeployment(message: any, writer: Writer) {
	if (message.id) {
		const idWriter = Writer.create();
		encodeDeploymentId(message.id, idWriter);
		writer.writeMessage(1, idWriter.finish());
	}
}

function encodeMsgCreateLease(message: any, writer: Writer) {
	const bidId = message.bidId ?? message.bid_id;
	if (bidId) {
		const bidWriter = Writer.create();
		encodeBidId(bidId, bidWriter);
		writer.writeMessage(1, bidWriter.finish());
	}
}

function encodeCertificateId(id: any, writer: Writer) {
	if (id.owner) {
		writer.writeUint32((1 << 3) | 2).writeString(id.owner);
	}

	if (id.serial) {
		writer.writeUint32((2 << 3) | 2).writeString(id.serial);
	}
}

function encodeDeploymentId(id: any, writer: Writer) {
	if (id.owner) {
		writer.writeUint32((1 << 3) | 2).writeString(id.owner);
	}

	if (id.dseq != null) {
		writer.writeUint32((2 << 3) | 0).writeVarint(id.dseq);
	}
}

function encodeBidId(id: any, writer: Writer) {
	if (id.owner) {
		writer.writeUint32((1 << 3) | 2).writeString(id.owner);
	}

	if (id.dseq != null) {
		writer.writeUint32((2 << 3) | 0).writeVarint(id.dseq);
	}

	if (id.gseq != null) {
		writer.writeUint32((3 << 3) | 0).writeVarint(id.gseq);
	}

	if (id.oseq != null) {
		writer.writeUint32((4 << 3) | 0).writeVarint(id.oseq);
	}

	if (id.provider) {
		writer.writeUint32((5 << 3) | 2).writeString(id.provider);
	}

	if (id.bseq != null) {
		writer.writeUint32((6 << 3) | 0).writeVarint(id.bseq);
	}
}

function encodeDeposit(deposit: any, writer: Writer) {
	if (deposit.amount) {
		const amountWriter = Writer.create();
		encodeCoin(deposit.amount, amountWriter);
		writer.writeMessage(1, amountWriter.finish());
	}

	for (const source of deposit.sources ?? []) {
		writer.writeUint32((5 << 3) | 0).writeVarint(source);
	}
}

function encodeCoin(coin: any, writer: Writer) {
	if (coin.denom) {
		writer.writeUint32((1 << 3) | 2).writeString(coin.denom);
	}

	if (coin.amount) {
		writer.writeUint32((2 << 3) | 2).writeString(coin.amount);
	}
}

function encodeGroupSpec(spec: any, writer: Writer) {
	if (spec.name) {
		writer.writeUint32((1 << 3) | 2).writeString(spec.name);
	}

	if (spec.requirements) {
		const requirementsWriter = Writer.create();
		encodePlacementRequirements(spec.requirements, requirementsWriter);
		writer.writeMessage(2, requirementsWriter.finish());
	}

	for (const resource of spec.resources ?? []) {
		const resourceWriter = Writer.create();
		encodeResourceUnit(resource, resourceWriter);
		writer.writeMessage(3, resourceWriter.finish());
	}
}

function encodePlacementRequirements(requirements: any, writer: Writer) {
	if (requirements.signedBy) {
		const signedByWriter = Writer.create();
		encodeSignedBy(requirements.signedBy, signedByWriter);
		writer.writeMessage(1, signedByWriter.finish());
	}

	for (const attribute of requirements.attributes ?? []) {
		const attributeWriter = Writer.create();
		encodeAttribute(attribute, attributeWriter);
		writer.writeMessage(2, attributeWriter.finish());
	}
}

function encodeSignedBy(signedBy: any, writer: Writer) {
	for (const value of signedBy.allOf ?? []) {
		writer.writeUint32((1 << 3) | 2).writeString(value);
	}

	for (const value of signedBy.anyOf ?? []) {
		writer.writeUint32((2 << 3) | 2).writeString(value);
	}
}

function encodeAttribute(attribute: any, writer: Writer) {
	if (attribute.key) {
		writer.writeUint32((1 << 3) | 2).writeString(attribute.key);
	}

	if (attribute.value) {
		writer.writeUint32((2 << 3) | 2).writeString(attribute.value);
	}
}

function encodeResourceUnit(resourceUnit: any, writer: Writer) {
	if (resourceUnit.resource) {
		const resourcesWriter = Writer.create();
		encodeResources(resourceUnit.resource, resourcesWriter);
		writer.writeMessage(1, resourcesWriter.finish());
	}

	if (resourceUnit.count != null) {
		writer.writeUint32((2 << 3) | 0).writeVarint(resourceUnit.count);
	}

	if (resourceUnit.price) {
		const priceWriter = Writer.create();
		encodeCoin(resourceUnit.price, priceWriter);
		writer.writeMessage(3, priceWriter.finish());
	}
}

function encodeResources(resources: any, writer: Writer) {
	if (resources.id != null) {
		writer.writeUint32((1 << 3) | 0).writeVarint(resources.id);
	}

	if (resources.cpu) {
		const cpuWriter = Writer.create();
		encodeComputeResource(resources.cpu, 'units', cpuWriter);
		writer.writeMessage(2, cpuWriter.finish());
	}

	if (resources.memory) {
		const memoryWriter = Writer.create();
		encodeComputeResource(resources.memory, 'quantity', memoryWriter);
		writer.writeMessage(3, memoryWriter.finish());
	}

	for (const storage of resources.storage ?? []) {
		const storageWriter = Writer.create();
		encodeStorage(storage, storageWriter);
		writer.writeMessage(4, storageWriter.finish());
	}

	if (resources.gpu) {
		const gpuWriter = Writer.create();
		encodeComputeResource(resources.gpu, 'units', gpuWriter);
		writer.writeMessage(5, gpuWriter.finish());
	}

	for (const endpoint of resources.endpoints ?? []) {
		const endpointWriter = Writer.create();
		encodeEndpoint(endpoint, endpointWriter);
		writer.writeMessage(6, endpointWriter.finish());
	}
}

function encodeComputeResource(
	resource: any,
	valueKey: 'units' | 'quantity',
	writer: Writer
) {
	if (resource[valueKey]) {
		const valueWriter = Writer.create();
		encodeResourceValue(resource[valueKey], valueWriter);
		writer.writeMessage(1, valueWriter.finish());
	}

	for (const attribute of resource.attributes ?? []) {
		const attributeWriter = Writer.create();
		encodeAttribute(attribute, attributeWriter);
		writer.writeMessage(2, attributeWriter.finish());
	}
}

function encodeStorage(storage: any, writer: Writer) {
	if (storage.name) {
		writer.writeUint32((1 << 3) | 2).writeString(storage.name);
	}

	if (storage.quantity) {
		const quantityWriter = Writer.create();
		encodeResourceValue(storage.quantity, quantityWriter);
		writer.writeMessage(2, quantityWriter.finish());
	}

	for (const attribute of storage.attributes ?? []) {
		const attributeWriter = Writer.create();
		encodeAttribute(attribute, attributeWriter);
		writer.writeMessage(3, attributeWriter.finish());
	}
}

function encodeEndpoint(endpoint: any, writer: Writer) {
	if (endpoint.kind != null) {
		writer.writeUint32((1 << 3) | 0).writeVarint(endpoint.kind);
	}

	const sequenceNumber = endpoint.sequenceNumber ?? endpoint.sequence_number;
	if (sequenceNumber != null) {
		writer.writeUint32((2 << 3) | 0).writeVarint(sequenceNumber);
	}
}

function encodeResourceValue(resourceValue: any, writer: Writer) {
	const value = resourceValue?.val ?? resourceValue;
	if (value instanceof Uint8Array && value.length > 0) {
		writer.writeUint32((1 << 3) | 2).writeBytes(value);
	}
}

export enum TxTypeUrl {
	MsgCreateCertificate = '/akash.cert.v1.MsgCreateCertificate',
	MsgRevokeCertificate = '/akash.cert.v1.MsgRevokeCertificate',
	MsgCreateDeployment = '/akash.deployment.v1beta4.MsgCreateDeployment',
	MsgCloseDeployment = '/akash.deployment.v1beta4.MsgCloseDeployment',
	MsgCreateLease = '/akash.market.v1beta5.MsgCreateLease'
}

const messageTypes = {
	[TxTypeUrl.MsgCreateCertificate]: createMessageType(
		encodeMsgCreateCertificate
	),
	[TxTypeUrl.MsgRevokeCertificate]: createMessageType(
		encodeMsgRevokeCertificate
	),
	[TxTypeUrl.MsgCreateDeployment]: createMessageType(encodeMsgCreateDeployment),
	[TxTypeUrl.MsgCloseDeployment]: createMessageType(encodeMsgCloseDeployment),
	[TxTypeUrl.MsgCreateLease]: createMessageType(encodeMsgCreateLease)
} satisfies Record<string, GeneratedType>;

export const getAkashTypeRegistry = () =>
	Object.entries(messageTypes) as [string, GeneratedType][];
