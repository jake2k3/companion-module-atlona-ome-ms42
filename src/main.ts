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

type PendingLineWaiter = {
	regex: RegExp
	resolve: (line: string) => void
	reject: (error: Error) => void
	timer: NodeJS.Timeout
}

export default class ModuleInstance extends InstanceBase<ModuleSchema> {
	config!: ModuleConfig // Setup in init()

	private telnet: TelnetHelper | undefined
	private receiveBuffer = ''
	private authenticated = false
	private pendingLineWaiters: PendingLineWaiter[] = []

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
			this.updateStatus(InstanceStatus.BadConfig, 'Target IP is required')
			return
		}
		this.updateStatus(InstanceStatus.Connecting)
		this.log('info', `Attempting initial Telnet connection to ${this.config.host}:${this.config.port}`)
		this.telnet = new TelnetHelper(this.config.host, this.config.port)
		this.telnet.on('connect', () => {
			this.authenticated = false
			this.updateStatus(InstanceStatus.Connecting, 'Connected; awaiting authentication')
			this.log('info', `Connected to device at ${this.config.host}:${this.config.port}`)
			this.receiveBuffer = ''
		})
		this.telnet.on('data', (data: Buffer) => {
			this.handleData(data)
		})
		this.telnet.on('error', (error) => {
			this.log('error', `Connection error: ${error.message}`)
			this.updateStatus(InstanceStatus.ConnectionFailure, error.message)
		})
		this.telnet.on('end', () => {
			this.log('info', `Connection to device at ${this.config.host}:${this.config.port} closed`)
			this.updateStatus(InstanceStatus.Disconnected, 'Connection closed')
		})
	}

	private destroyConnection(): void {
		this.telnet?.destroy()
		this.telnet = undefined
		this.authenticated = false
		this.receiveBuffer = ''
		for (const waiter of this.pendingLineWaiters) {
			clearTimeout(waiter.timer)
			waiter.reject(new Error('Connection closed while waiting for a response line'))
		}
		this.pendingLineWaiters = []
	}

	async waitForLine(regex: RegExp, timeoutMs: number): Promise<string> {
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				this.pendingLineWaiters = this.pendingLineWaiters.filter((waiter) => waiter !== pendingWaiter)
				reject(new Error(`Timed out waiting for line matching ${regex}`))
			}, timeoutMs)

			const pendingWaiter: PendingLineWaiter = {
				regex,
				resolve: (line) => {
					clearTimeout(timer)
					this.pendingLineWaiters = this.pendingLineWaiters.filter((waiter) => waiter !== pendingWaiter)
					resolve(line)
				},
				reject: (error) => {
					clearTimeout(timer)
					this.pendingLineWaiters = this.pendingLineWaiters.filter((waiter) => waiter !== pendingWaiter)
					reject(error)
				},
				timer,
			}

			this.pendingLineWaiters.push(pendingWaiter)
		})
	}

	// Query the status of the device on connection and update variables accordingly
	private async queryInitialStatus(): Promise<void> {
		try {
			// Get Device Type
			this.sendCommand('Type')
			const varType = await this.waitForLine(/^(AT-.*)/i, 3000)
			this.log('debug', `Device type: ${varType}`)

			// Get FW Version
			this.sendCommand('Version')
			const varVersion = await this.waitForLine(/^\d+\.\d+\.\d+$/, 3000)
			this.log('debug', `Firmware version: ${varVersion}`)

			// Get Power Status
			this.sendCommand('PWSTA')
			const queryPower = await this.waitForLine(/^(PWON|PWOFF)$/i, 3000)
			const replyPower = queryPower.trim().toUpperCase()

			let varPower = ''
			if (replyPower === 'PWON') {
				varPower = 'on'
			} else if (replyPower === 'PWOFF') {
				varPower = 'off'
			} else {
				this.log('warn', `Unexpected power response: ${queryPower}`)
			}

			// Get Input Connection Status
			this.sendCommand('InputStatus')

			const queryInput = await this.waitForLine(/^InputStatus\s*([01]{4})$/i, 3000)
			const m = queryInput.match(/^InputStatus\s*([01]{4})$/i)
			if (!m) {
				this.log('warn', `Unexpected input status response: ${queryInput}`)
				return
			}
			const bits = m[1]

			const varInput1 = bits.charAt(0) === '1' ? 'connected' : 'not-connected'
			const varInput2 = bits.charAt(1) === '1' ? 'connected' : 'not-connected'
			const varInput3 = bits.charAt(2) === '1' ? 'connected' : 'not-connected'
			const varInput4 = bits.charAt(3) === '1' ? 'connected' : 'not-connected'

			// Get Output Enablement Status
			this.sendCommand('x1$ sta')
			const queryx1$ = await (this as any).waitForLine(/^x1\$\s*(on|off)$/i, 3000)
			const replyx1$ = queryx1$.match(/^x1\$\s*(on|off)$/i)
			if (!replyx1$) {
				this.log('warn', `Unexpected response for x1$: ${queryx1$}`)
			}
			const varx1$ = replyx1$ ? replyx1$[1].toLowerCase() : 'off'

			this.sendCommand('x2$ sta')
			const queryx2$ = await (this as any).waitForLine(/^x2\$\s*(on|off)$/i, 3000)
			const replyx2$ = queryx2$.match(/^x2\$\s*(on|off)$/i)
			if (!replyx2$) {
				this.log('warn', `Unexpected response for x2$: ${queryx2$}`)
			}
			const varx2$ = replyx2$ ? replyx2$[1].toLowerCase() : 'off'

			// Get XY Routing Status
			this.sendCommand('Status')
			const queryRouting = await (this as any).waitForLine(/^x([1-4])AVx1\s*,\s*x([1-4])AVx2$/i, 3000)
			const replyRouting = queryRouting.match(/x([1-4])AVx1\s*,\s*x([1-4])AVx2/i)
			if (!replyRouting) {
				this.log('warn', `Unexpected XY routing response: ${queryRouting}`)
				return
			}
			const varRouteOutput1 = replyRouting[1]
			const varRouteOutput2 = replyRouting[2]

			// Get Blink Status
			this.sendCommand('Blink sta')

			const queryBlink = await (this as any).waitForLine(/^(Blink on|Blink off)$/i, 3000)
			const replyBlink = queryBlink.trim()

			let varBlink = ''
			if (replyBlink === 'Blink on') {
				varBlink = 'on'
			} else if (replyBlink === 'Blink off') {
				varBlink = 'off'
			} else {
				this.log('warn', `Unexpected blink response: ${queryBlink}`)
			}

			// Get LRAUD Status
			this.sendCommand('LRAUD sta')

			const queryLRAUD = await (this as any).waitForLine(/^(LRAUD on|LRAUD off)$/i, 3000)
			const replyLRAUD = queryLRAUD.trim()

			let varLRAUD = ''
			if (replyLRAUD === 'LRAUD on') {
				varLRAUD = 'on'
			} else if (replyLRAUD === 'LRAUD off') {
				varLRAUD = 'off'
			} else {
				this.log('warn', `Unexpected analog audio output response: ${queryLRAUD}`)
			}

			// Get USB Host Logic Status
			this.sendCommand('USBHostLogic sta')

			const queryUsbLogic = await this.waitForLine(
				/^(USBHostLogic follow usb|USBHostLogic follow video|manual)$/i,
				3000,
			)
			const replyUsbLogic = queryUsbLogic.trim()

			let varUsbLogic = ''
			if (replyUsbLogic === 'USBHostLogic follow usb') {
				varUsbLogic = 'follow-usb'
			} else if (replyUsbLogic === 'USBHostLogic follow video') {
				varUsbLogic = 'follow-video'
			} else if (replyUsbLogic === 'USBHostLogic manual') {
				varUsbLogic = 'manual'
			} else {
				this.log('warn', `Unexpected USB host logic response: ${queryUsbLogic}`)
			}

			// Get USB Host Route Status
			this.sendCommand('USBHostRoute sta')

			const queryUsbRoute = await this.waitForLine(
				/^(USBHostRoute C|USBHostRoute 1|USBHostRoute 2|USBHostRoute 3)$/i,
				3000,
			)
			const replyUsbRoute = queryUsbRoute.trim()

			let varUsbRoute = ''
			if (replyUsbRoute === 'USBHostRoute C') {
				varUsbRoute = 'C'
			} else if (replyUsbRoute === 'USBHostRoute 1') {
				varUsbRoute = '1'
			} else if (replyUsbRoute === 'USBHostRoute 2') {
				varUsbRoute = '2'
			} else if (replyUsbRoute === 'USBHostRoute 3') {
				varUsbRoute = '3'
			} else {
				this.log('warn', `Unexpected USB host route response: ${queryUsbRoute}`)
			}

			// Get USB VBus Control Status
			this.sendCommand('UsbVbusControl sta')

			const queryUsbVbus = await this.waitForLine(/^(UsbVbusControl on|UsbVbusControl off)$/i, 3000)
			const replyUsbVbus = queryUsbVbus.trim()

			let varUsbVbus = ''
			if (replyUsbVbus === 'UsbVbusControl on') {
				varUsbVbus = 'on'
			} else if (replyUsbVbus === 'UsbVbusControl off') {
				varUsbVbus = 'off'
			} else {
				this.log('warn', `Unexpected UsbVbusControl status response: ${queryUsbVbus}`)
			}

			// Get VOUT Mute Status
			this.sendCommand('VOUTMute1 sta')

			const queryVOUTMute1 = await this.waitForLine(/^(VOUTMute1 on|VOUTMute1 off)$/i, 3000)
			const replyVOUTMute1 = queryVOUTMute1.trim()

			let varVOUTMute1 = ''
			let varVOUTMute2 = ''
			if (replyVOUTMute1 === 'VOUTMute1 on') {
				varVOUTMute1 = 'on'
			} else if (replyVOUTMute1 === 'VOUTMute1 off') {
				varVOUTMute1 = 'off'
			} else {
				this.log('warn', `Unexpected VOUTMute1 status response: ${queryVOUTMute1}`)
			}

			this.sendCommand('VOUTMute2 sta')
			const queryVOUTMute2 = await this.waitForLine(/^(VOUTMute2 on|VOUTMute2 off)$/i, 3000)
			const replyVOUTMute2 = queryVOUTMute2.trim()

			if (replyVOUTMute2 === 'VOUTMute2 on') {
				varVOUTMute2 = 'on'
			} else if (replyVOUTMute2 === 'VOUTMute2 off') {
				varVOUTMute2 = 'off'
			} else {
				this.log('warn', `Unexpected VOUTMute2 status response: ${queryVOUTMute2}`)
			}

			// Update all Variables
			this.setVariableValues({
				type: `${varType}`,
				version: `${varVersion}`,
				input1Connected: `${varInput1}`,
				input2Connected: `${varInput2}`,
				input3Connected: `${varInput3}`,
				input4Connected: `${varInput4}`,
				output1Enabled: `${varx1$}`,
				output2Enabled: `${varx2$}`,
				routeOutput1: `${varRouteOutput1}`,
				routeOutput2: `${varRouteOutput2}`,
				statusBlink: `${varBlink}`,
				statusLRAUD: `${varLRAUD}`,
				statusUsbHostLogic: `${varUsbLogic}`,
				statusUsbHostRoute: `${varUsbRoute}`,
				statusUsbVbusControl: `${varUsbVbus}`,
				statusPower: `${varPower}`,
				statusVOUTMute1: `${varVOUTMute1}`,
				statusVOUTMute2: `${varVOUTMute2}`,
			})
			this.log('info', 'Initial status query complete, variables updated.')
		} catch (err: any) {
			this.log('error', `Failed to retrieve initial status: ${err?.message ?? err}`)
		}
	}

	private handleData(data: Buffer): void {
		const chunk = data.toString('utf8')
		this.receiveBuffer += chunk

		this.log('debug', `RX chunk: ${JSON.stringify(chunk)}`)
		this.handleLoginPrompts()

		const lines = this.receiveBuffer.split(/\r?\n/)
		this.receiveBuffer = lines.pop() ?? ''

		for (const rawLine of lines) {
			const line = rawLine.trim()

			this.log('debug', `RX: [${line}]`)

			const matchingWaiter = this.pendingLineWaiters.find((waiter) => waiter.regex.test(line))
			if (matchingWaiter) {
				matchingWaiter.resolve(line)
				continue
			}

			if (line === 'Welcome to TELNET.') {
				if (!this.authenticated) {
					this.authenticated = true
					this.updateStatus(InstanceStatus.Ok, 'Authenticated')
					this.log('info', 'Authenticated successfully')
					void this.queryInitialStatus()
				}
				continue
			}
		}
	}

	private handleLoginPrompts(): void {
		let handled = true
		while (handled) {
			handled = false

			if (this.receiveBuffer.includes('Username:')) {
				this.sendRawCommand(this.config.username)
				this.receiveBuffer = this.receiveBuffer.replace(/^[\s\S]*Username:/, '')
				handled = true
			}

			if (this.receiveBuffer.includes('Password:')) {
				this.sendRawCommand(this.config.password)
				this.receiveBuffer = this.receiveBuffer.replace(/^[\s\S]*Password:/, '')
				handled = true
			}
		}
	}

	private sendRawCommand(command: string): void {
		if (!this.telnet?.isConnected) {
			this.log('warn', `Cannot send raw command while disconnected: ${command}`)
			return
		}

		const cleanCommand = command.replace(/[\r\n]+$/g, '')
		if (!cleanCommand) {
			return
		}

		this.log('debug', `Sending raw command: ${cleanCommand}`)
		this.telnet.send(`${cleanCommand}\r`)
	}

	sendCommand(command: string): void {
		if (!this.telnet?.isConnected) {
			this.log('warn', `Cannot send command while disconnected: ${command}`)
			return
		}

		if (!this.authenticated) {
			this.log('warn', `Cannot send command before authentication: ${command}`)
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
