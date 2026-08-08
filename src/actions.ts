import type ModuleInstance from './main.js'

export type ActionsSchema = {
	get_power_status: { options: {} }
}

export function UpdateActions(self: ModuleInstance): void {
	self.setActionDefinitions({
		get_power_status: {
			name: 'Get Power Status',
			options: [],
			callback: async () => {
				try {
					self.log('info', 'Querying device for power status (PWSTAT)')
					self.sendCommand('PWSTAT')

					// Wait for a response line matching PWON or PWOFF, 1sec timeout
					const line = await (self as any).waitForLine(/^(PWON|PWOFF)$/i, 1000)
					const status = line.trim().toUpperCase()

					if (status === 'PWON') {
						self.log('info', 'Power status: ON (PWON)')
					} else if (status === 'PWOFF') {
						self.log('info', 'Power status: OFF (PWOFF)')
					} else {
						self.log('warn', `Unexpected power response: ${line}`)
					}
				} catch (err: any) {
					self.log('error', `Failed to retrieve power status: ${err?.message ?? err}`)
				}
			},
		},
	})
}
