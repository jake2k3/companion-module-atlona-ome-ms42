import { InstanceBase, InstanceStatus, TelnetHelper } from '@companion-module/base';
import { GetConfigFields } from './config.js';
import { UpdateVariableDefinitions } from './variables.js';
import { UpgradeScripts } from './upgrades.js';
import { UpdateActions } from './actions.js';
import { UpdateFeedbacks } from './feedbacks.js';
import { UpdatePresets } from './presets.js';
export { UpgradeScripts };
export default class ModuleInstance extends InstanceBase {
    config; // Setup in init()
    telnet;
    receiveBuffer = '';
    authenticated = false;
    pendingLineWaiters = [];
    constructor(internal) {
        super(internal);
    }
    async init(config) {
        this.config = config;
        this.updateActions(); // export actions
        this.updateFeedbacks(); // export feedbacks
        this.updatePresets(); // export Presets
        this.updateVariableDefinitions(); // export variable definitions
        this.initConnection();
    }
    // When module gets deleted
    async destroy() {
        this.destroyConnection();
        this.log('debug', 'Module destroyed');
    }
    // When user saves changes to the module config
    async configUpdated(config) {
        this.config = config;
        this.initConnection();
    }
    // Return config fields for web config
    getConfigFields() {
        return GetConfigFields();
    }
    initConnection() {
        this.destroyConnection();
        if (!this.config.host) {
            this.updateStatus(InstanceStatus.BadConfig, 'Target IP is required');
            return;
        }
        this.updateStatus(InstanceStatus.Connecting);
        this.log('info', `Attempting initial Telnet connection to ${this.config.host}:${this.config.port} with build 2026-08-11`);
        this.telnet = new TelnetHelper(this.config.host, this.config.port);
        this.telnet.on('connect', () => {
            this.authenticated = false;
            this.updateStatus(InstanceStatus.Connecting, 'Connected; awaiting authentication');
            this.log('info', `Connected to OME-MS42 at ${this.config.host}:${this.config.port}`);
            this.receiveBuffer = '';
        });
        this.telnet.on('data', (data) => {
            this.handleData(data);
        });
        this.telnet.on('error', (error) => {
            this.log('error', `Connection error: ${error.message}`);
            this.updateStatus(InstanceStatus.ConnectionFailure, error.message);
        });
        this.telnet.on('end', () => {
            this.log('info', 'Connection to OME-MS42 closed');
            this.updateStatus(InstanceStatus.Disconnected, 'Connection closed');
        });
    }
    destroyConnection() {
        this.telnet?.destroy();
        this.telnet = undefined;
        this.authenticated = false;
        this.receiveBuffer = '';
        for (const waiter of this.pendingLineWaiters) {
            clearTimeout(waiter.timer);
            waiter.reject(new Error('Connection closed while waiting for a response line'));
        }
        this.pendingLineWaiters = [];
    }
    async waitForLine(regex, timeoutMs) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pendingLineWaiters = this.pendingLineWaiters.filter((waiter) => waiter !== pendingWaiter);
                reject(new Error(`Timed out waiting for line matching ${regex}`));
            }, timeoutMs);
            const pendingWaiter = {
                regex,
                resolve: (line) => {
                    clearTimeout(timer);
                    this.pendingLineWaiters = this.pendingLineWaiters.filter((waiter) => waiter !== pendingWaiter);
                    resolve(line);
                },
                reject: (error) => {
                    clearTimeout(timer);
                    this.pendingLineWaiters = this.pendingLineWaiters.filter((waiter) => waiter !== pendingWaiter);
                    reject(error);
                },
                timer,
            };
            this.pendingLineWaiters.push(pendingWaiter);
        });
    }
    handleData(data) {
        const chunk = data.toString('utf8');
        this.receiveBuffer += chunk;
        this.log('debug', `RX chunk: ${JSON.stringify(chunk)}`);
        this.handleLoginPrompts();
        const lines = this.receiveBuffer.split(/\r?\n/);
        this.receiveBuffer = lines.pop() ?? '';
        for (const rawLine of lines) {
            const line = rawLine.trim();
            this.log('debug', `RX: [${line}]`);
            const matchingWaiter = this.pendingLineWaiters.find((waiter) => waiter.regex.test(line));
            if (matchingWaiter) {
                matchingWaiter.resolve(line);
                continue;
            }
            if (line === 'Welcome to TELNET.') {
                if (!this.authenticated) {
                    this.authenticated = true;
                    this.updateStatus(InstanceStatus.Ok, 'Authenticated');
                    this.log('info', 'Authenticated successfully');
                }
                continue;
            }
        }
    }
    handleLoginPrompts() {
        let handled = true;
        while (handled) {
            handled = false;
            if (this.receiveBuffer.includes('Username:')) {
                this.sendRawCommand(this.config.username);
                this.receiveBuffer = this.receiveBuffer.replace(/^[\s\S]*Username:/, '');
                handled = true;
            }
            if (this.receiveBuffer.includes('Password:')) {
                this.sendRawCommand(this.config.password);
                this.receiveBuffer = this.receiveBuffer.replace(/^[\s\S]*Password:/, '');
                handled = true;
            }
        }
    }
    sendRawCommand(command) {
        if (!this.telnet?.isConnected) {
            this.log('warn', `Cannot send raw command while disconnected: ${command}`);
            return;
        }
        const cleanCommand = command.replace(/[\r\n]+$/g, '');
        if (!cleanCommand) {
            return;
        }
        this.log('debug', `Sending raw command: ${cleanCommand}`);
        this.telnet.send(`${cleanCommand}\r`);
    }
    sendCommand(command) {
        if (!this.telnet?.isConnected) {
            this.log('warn', `Cannot send command while disconnected: ${command}`);
            return;
        }
        if (!this.authenticated) {
            this.log('warn', `Cannot send command before authentication: ${command}`);
            return;
        }
        const cleanCommand = command.replace(/[\r\n]+$/g, '');
        if (!cleanCommand) {
            return;
        }
        this.log('debug', `Sending command: ${cleanCommand}`);
        this.telnet.send(`${cleanCommand}\r`);
    }
    updateActions() {
        UpdateActions(this);
    }
    updateFeedbacks() {
        UpdateFeedbacks(this);
    }
    updatePresets() {
        UpdatePresets(this);
    }
    updateVariableDefinitions() {
        UpdateVariableDefinitions(this);
    }
}
//# sourceMappingURL=main.js.map