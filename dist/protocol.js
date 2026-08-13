import { InstanceStatus, TelnetHelper } from '@companion-module/base';
export class AtlonaProtocol {
    instance;
    config;
    socket;
    receiveBuffer = '';
    password;
    constructor(instance, config, password) {
        this.instance = instance;
        this.config = config;
        this.password = password;
    }
    connect() {
        this.destroy();
        this.instance.updateStatus(InstanceStatus.Connecting);
        this.socket = new TelnetHelper(this.config.host, this.config.port);
        this.socket.on('connect', () => {
            this.instance.log('info', 'Connected to OME-MS42');
            this.receiveBuffer = '';
        });
        this.socket.on('data', (data) => {
            this.handleData(data.toString('utf8'));
        });
        this.socket.on('error', (error) => {
            this.instance.log('error', `Telnet error: ${error.message}`);
            this.instance.updateStatus(InstanceStatus.ConnectionFailure, error.message);
        });
        this.socket.on('end', () => {
            this.instance.updateStatus(InstanceStatus.Disconnected, 'Connection closed');
        });
    }
    send(command) {
        if (!this.socket) {
            this.instance.log('warn', `Not connected; command not sent: ${command}`);
            return;
        }
        const message = `${command}\r`;
        this.instance.log('debug', `Sending: ${command}`);
        this.socket.send(message);
    }
    destroy() {
        this.socket?.destroy();
        this.socket = undefined;
        this.receiveBuffer = '';
    }
    handleData(chunk) {
        this.receiveBuffer += chunk;
        this.instance.log('debug', `Received: ${JSON.stringify(chunk)}`);
        this.handleLoginPrompts();
        const lines = this.receiveBuffer.split(/\r?\n/);
        this.receiveBuffer = lines.pop() ?? '';
        for (const line of lines) {
            this.handleLine(line.trim());
        }
    }
    handleLoginPrompts() {
        if (this.receiveBuffer.includes('Username:')) {
            this.socket?.send(`${this.config.username}\r`);
            this.receiveBuffer = '';
            return;
        }
        if (this.receiveBuffer.includes('Password:')) {
            this.socket?.send(`${this.password ?? ''}\r`);
            this.receiveBuffer = '';
        }
    }
    handleLine(line) {
        if (!line) {
            return;
        }
        if (line.includes('Welcome to TELNET.')) {
            this.instance.log('info', 'Authentication successful');
        }
        this.instance.log('debug', `OME-MS42 response: ${line}`);
    }
}
//# sourceMappingURL=protocol.js.map