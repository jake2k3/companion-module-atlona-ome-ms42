import { InstanceBase, InstanceStatus, TelnetHelper, type SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateVariableDefinitions, type VariablesSchema } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions, type ActionsSchema } from './actions.js'
import { UpdateFeedbacks, type FeedbacksSchema } from './feedbacks.js'
import { UpdatePresets } from './presets.js'

export type ModuleSchema = {
	config: ModuleConfig
	secrets: undefined
	actions: ActionsSchema
	feedbacks: FeedbacksSchema
	variables: VariablesSchema
}

export { UpgradeScripts }

export default class ModuleInstance extends InstanceBase<ModuleSchema> {
	config!: ModuleConfig // Setup in init()

	private telnet: TelnetHelper | undefined
	private receiveBuffer = ''
	
	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: ModuleConfig): Promise<void> {
		this.config = config
		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
		this.updatePresets() // export Presets
		this.updateVariableDefinitions() // export variable definitions
		this.initConnection()
	}
	
	// When module gets deleted
	async destroy(): Promise<void> {
		this.destroyConnection()
		this.log('debug', 'Module destroyed')
	}

	// When user saves changes to the module config
	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = config
		this.initConnection()
	}

	// Return config fields for web config
	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	private initConnection(): void {
		this.destroyConnection()
		if (!this.config.host) {	
				this.updateStatus(
					InstanceStatus.BadConfig,
					'Target IP is required'
				)
			return
		}
		this.updateStatus(InstanceStatus.Connecting)
		this.telnet = new TelnetHelper(
			this.config.host,
			this.config.port,
		)
		this.telnet.on('connect', () => {
			this.log(
				'info',
				`Connected to OME-MS42 at ${this.config.host}:${this.config.port}`,
				)
			this.receiveBuffer = ''
		} )
		this.telnet.on('data', (data: Buffer) => {
				this.handleData(data)
		} )
		this.telnet.on('error', (error) => {
				this.log(
					'error',
					`Connection error: ${error.message}`,
				)
				this.updateStatus(
					InstanceStatus.ConnectionFailure,
					error.message,
				)
		} )
		this.telnet.on('end', () => {
				this.log('info', 'Connection to OME-MS42 closed')
				this.updateStatus(
						InstanceStatus.Disconnected,
						'Connection closed',
				)
		} )
	}

	private destroyConnection(): void {
			this.telnet?.destroy()
			this.telnet = undefined
			this.receiveBuffer = ''
	}

	private handleData(data: Buffer): void {
		const chunk = data.toString('utf8')
		this.log('debug', `Received: ${JSON.stringify(chunk)}`)
		this.receiveBuffer += chunk

		// ADD MS42 LOGIN PROMPT HANDLING AND RESPONSE PARSE HERE //
	}

	sendCommand(command: string): void {
		if (!this.telnet?.isConnected) {
			this.log(
				'warn',
				`Cannot send command while disconnected: ${command}`,
			)
			return
		}
		const cleanCommand = command.replace(/[\r\n]+$/g, '')
		if (!cleanCommand) {
			return
		}
		this.log('debug', `Sending command: ${cleanCommand}`)
		this.telnet.send(`${cleanCommand}\r`)
	}
	
	updateActions(): void {
		UpdateActions(this)
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	updatePresets(): void {
		UpdatePresets(this)
	}

	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}
}
