import { BitString, Integer, PrintableString, Utf8String } from 'asn1js';

import {
	AttributeTypeAndValue,
	BasicConstraints,
	Certificate,
	ExtKeyUsage,
	Extension,
	getAlgorithmParameters
} from 'pkijs';
const HASH_ALG = 'SHA-256';
const SIGN_ALG = 'ECDSA';

export interface pems {
	csr: string;
	publicKey: string;
	publicKeyBytes: Uint8Array;
	privateKey: string;
}

export interface CertificateOptions {
	validityDays: number;
}

const DEFAULT_CERTIFICATE_OPTIONS = {
	validityDays: 365
} satisfies CertificateOptions;

export async function createCertificate(
	address: string,
	options?: CertificateOptions
): Promise<pems> {
	options = { ...DEFAULT_CERTIFICATE_OPTIONS, ...options };
	// get algo params
	const algo = getAlgorithmParameters(SIGN_ALG, 'generateKey');

	const keyPair = await crypto.subtle.generateKey(
		{
			name: SIGN_ALG,
			namedCurve: 'P-256'
		} satisfies EcKeyGenParams,
		true,
		algo.usages
	);

	const cert = await createCSR(keyPair, HASH_ALG, {
		commonName: address,
		validityDays: options.validityDays
	});

	const certBER = new Uint8Array(cert.toSchema(true).toBER(false));
	const spki = new Uint8Array(
		await crypto.subtle.exportKey('spki', keyPair.publicKey)
	);
	const pkcs8 = new Uint8Array(
		await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
	);

	return {
		csr: toPem('CERTIFICATE', certBER),
		privateKey: toPem('PRIVATE KEY', pkcs8),
		publicKey: toPem('PUBLIC KEY', spki),
		publicKeyBytes: spki
	};
}

async function createCSR(
	keyPair: CryptoKeyPair,
	hashAlg: string,
	{ commonName, validityDays }: { commonName: string; validityDays: number }
) {
	const cert = new Certificate();
	cert.version = 2;

	cert.serialNumber = new Integer({ value: Date.now() }) as any;

	cert.issuer.typesAndValues.push(
		new AttributeTypeAndValue({
			type: '2.5.4.3', // Common name
			value: new PrintableString({
				value: commonName
			}) as any
		})
	);

	cert.subject.typesAndValues.push(
		new AttributeTypeAndValue({
			type: '2.5.4.3', // Common name
			value: new PrintableString({
				value: commonName
			}) as any
		})
	);

	cert.subject.typesAndValues.push(
		new AttributeTypeAndValue({
			type: '2.23.133.2.6',
			value: new Utf8String({
				value: 'v0.0.1'
			}) as any
		})
	);

	cert.extensions = [];

	//region "KeyUsage" extension
	const bitArray = new ArrayBuffer(1);
	const bitView = new Uint8Array(bitArray);

	bitView[0] |= 0x10; //data encypherment
	bitView[0] |= 0x20; //key Encipherment

	const keyUsage = new BitString({ valueHex: bitArray });

	cert.extensions.push(
		new Extension({
			extnID: '2.5.29.15',
			critical: true,
			extnValue: keyUsage.toBER(false),
			parsedValue: keyUsage // Parsed value for well-known extensions
		})
	);
	//endregion

	//region Extended Key Usage
	const extKeyUsage = new ExtKeyUsage({
		keyPurposes: [
			'1.3.6.1.5.5.7.3.2' // id-kp-clientAuth
		]
	});

	cert.extensions.push(
		new Extension({
			extnID: '2.5.29.37',
			extnValue: extKeyUsage.toSchema().toBER(false),
			parsedValue: extKeyUsage // Parsed value for well-known extensions
		})
	);
	//endregion

	//region "BasicConstraints" extension
	const basicConstr = new BasicConstraints({
		cA: false
	});

	cert.extensions.push(
		new Extension({
			extnID: '2.5.29.19',
			critical: true,
			extnValue: basicConstr.toSchema().toBER(false),
			parsedValue: basicConstr // Parsed value for well-known extensions
		})
	);
	//endregion

	await cert.subjectPublicKeyInfo.importKey(keyPair.publicKey);
	setValidityPeriod(cert, new Date(), validityDays);
	await cert.sign(keyPair.privateKey, hashAlg);
	return cert;
}

function toPem(label: string, bytes: Uint8Array) {
	return `-----BEGIN ${label}-----\n${formatPEM(bytesToBase64(bytes))}\n-----END ${label}-----`;
}

function bytesToBase64(bytes: Uint8Array) {
	let binary = '';

	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}

	return btoa(binary);
}

// add line break every 64th character
function formatPEM(pemString: string) {
	return pemString.replace(/(.{64})/g, '$1\n');
}

function setValidityPeriod(
	cert: { notBefore: { value: Date }; notAfter: { value: Date } },
	startDate: Date,
	durationInDays: number
) {
	const start = new Date(startDate);
	const end = new Date(start.getTime() + durationInDays * 24 * 60 * 60 * 1000);

	cert.notBefore.value = start;
	cert.notAfter.value = end;
}
