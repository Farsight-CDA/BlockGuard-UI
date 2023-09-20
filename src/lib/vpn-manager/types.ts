export type ConnectionStatus =
	| 'Connected'
	| 'Connecting'
	| 'Disconnecting'
	| 'Failed';

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
