import { InstanceStatus, TelnetHelper } from '@companion-module/base'

import type { ModuleConfig } from './config.js'

interface Logger {
	log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void
	updateStatus(status: InstanceStatus, message?: string): void
}

export class AtlonaProtocol {
	private socket: TelnetHelper | undefined
	private receiveBuffer = ''

	public constructor(
		private readonly instance: Logger,
		private readonly config: ModuleConfig,
	) {}

	public connect(): void {
		this.destroy()

		this.instance.updateStatus(InstanceStatus.Connecting)

		this.socket = new TelnetHelper(this.config.host, this.config.port)

		this.socket.on('connect', () => {
			this.instance.log('info', 'Connected to AT-OME-MS42')
			this.receiveBuffer = ''
		})

		this.socket.on('data', (data: Buffer) => {
			this.handleData(data.toString('utf8'))
		})

		this.socket.on('error', (error) => {
			this.instance.log('error', `Telnet error: ${error.message}`)
			this.instance.updateStatus(InstanceStatus.ConnectionFailure, error.message)
		})

		this.socket.on('end', () => {
			this.instance.updateStatus(InstanceStatus.Disconnected, 'Connection closed')
		})
	}

	public send(command: string): void {
		if (!this.socket) {
			this.instance.log('warn', `Not connected; command not sent: ${command}`)
			return
		}

		const message = `${command}\r`

		this.instance.log('debug', `Sending: ${command}`)
		this.socket.send(message)
	}

	public destroy(): void {
		this.socket?.destroy()
		this.socket = undefined
		this.receiveBuffer = ''
	}

	private handleData(chunk: string): void {
		this.receiveBuffer += chunk

		this.instance.log('debug', `Received: ${JSON.stringify(chunk)}`)

		this.handleLoginPrompts()

		const lines = this.receiveBuffer.split(/\r?\n/)
		this.receiveBuffer = lines.pop() ?? ''

		for (const line of lines) {
			this.handleLine(line.trim())
		}
	}

	private handleLoginPrompts(): void {
		if (this.receiveBuffer.includes('Username:')) {
			this.socket?.send(`${this.config.username}\r`)
			this.receiveBuffer = ''
			return
		}

		if (this.receiveBuffer.includes('Password:')) {
			this.socket?.send(`${this.config.password}\r`)
			this.receiveBuffer = ''
		}
	}

	private handleLine(line: string): void {
		if (!line) {
			return
		}

		if (line.includes('Welcome to TELNET.')) {
			this.instance.log('info', 'Authentication successful')
		}

		this.instance.log('debug', `AT-OME-MS42 response: ${line}`)
	}
}
