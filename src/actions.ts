import type ModuleInstance from './main.js'

export type ActionsSchema = {
	get_power_status: { options: {} }
	blink_toggle: { options: {} }
}

export function UpdateActions(self: ModuleInstance): void {
	self.setActionDefinitions({
		get_power_status: {
			name: 'Get Power Status',
			options: [],
			callback: async () => {
				try {
					self.log('info', 'Querying device for power status (PWSTA)')
					self.sendCommand('PWSTA')

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

		blink_toggle: {
			name: 'Blink',
			options: [],
			callback: async () => {
				try {
					self.log('info', 'Querying device for blink status')
					self.sendCommand('Blink sta')

					const line = await (self as any).waitForLine(/^(Blink on|Blink off)$/i, 1000)
					const status = line.trim().toUpperCase()

					if (status === 'Blink on') {
						self.log('info', 'Blink is ON, turning OFF')
						self.sendCommand('Blink off')
					} else if (status === 'Blink off') {
						self.log('info', 'Blink is OFF, turning ON')
						self.sendCommand('Blink on')
					} else {
						self.log('warn', `Unexpected blink response: ${line}`)
					}
				} catch (err: any) {
					self.log('error', `Toggle failed: ${err?.message ?? err}`)
				}
			},
		},
	})
}
