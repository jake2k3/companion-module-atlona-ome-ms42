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
        this.telnet = new TelnetHelper(this.config.host, this.config.port);
        this.telnet.on('connect', () => {
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
        this.receiveBuffer = '';
    }
    handleData(data) {
        const chunk = data.toString('utf8');
        this.log('debug', `Received: ${JSON.stringify(chunk)}`);
        this.receiveBuffer += chunk;
        // ADD MS42 LOGIN PROMPT HANDLING AND RESPONSE PARSE HERE //
    }
    sendCommand(command) {
        if (!this.telnet?.isConnected) {
            this.log('warn', `Cannot send command while disconnected: ${command}`);
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