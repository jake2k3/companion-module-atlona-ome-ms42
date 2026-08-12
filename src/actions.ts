import type ModuleInstance from './main.js'

export type ActionsSchema = {
	get_power_status: { options: {} }
	blink: { options: { mode: 'on' | 'off' | 'toggle' } }
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

		blink: {
			name: 'Blink',
			options: [
				{
					id: 'mode',
					type: 'dropdown',
					label: 'Mode',
					default: 'toggle',
					choices: [
						{ id: 'on', label: 'On' },
						{ id: 'off', label: 'Off' },
						{ id: 'toggle', label: 'Toggle' },
					],
				},
			],
			callback: async (action) => {
				const mode = action.options.mode
				if (mode === 'on') {
					self.log('info', 'Turning blink ON')
					self.sendCommand('Blink on')
					return
				}

				if (mode === 'off') {
					self.log('info', 'Turning blink OFF')
					self.sendCommand('Blink off')
					return
				}

				self.log('info', 'Querying device for blink status')
				self.sendCommand('Blink sta')

				const line = await (self as any).waitForLine(/^(Blink on|Blink off)$/i, 5000)
				const status = line.trim()

				if (status === 'Blink on') {
					self.log('info', 'Blink is ON, turning OFF')
					self.sendCommand('Blink off')
				} else if (status === 'Blink off') {
					self.log('info', 'Blink is OFF, turning ON')
					self.sendCommand('Blink on')
				} else {
					self.log('warn', `Unexpected blink response: ${line}`)
				}
			},
		},
	})
}
