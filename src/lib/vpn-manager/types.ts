type ConnectionStatus =
	| 'Connected'
	| 'Connecting'
	| 'Disconnecting'
	| 'Offline'
	| 'Failed';

export interface VPNConnectionStatus {
	status: ConnectionStatus;
	incomingBytes: number;
	outgoingBytes: number;
}

interface VPNConnection {
	dseq: number;
	status: ConnectionStatus;
}

export type VPNConnectionInfo =
	| {
			isActive: true;
			connection: VPNConnection;
	  }
	| {
			isActive: false;
	  };
