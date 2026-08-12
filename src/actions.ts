import type ModuleInstance from './main.js'

export type ActionsSchema = {
	blink: { options: { mode: 'on' | 'off' | 'toggle' } }
	display_button: { options: { mode: 'on' | 'off' | 'toggle' } }
	input_status: { options: {} }
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	get_power_status: { options: {} }
}

export function UpdateActions(self: ModuleInstance): void {
	self.setActionDefinitions({
		blink: {
			name: 'Blink',
			description: 'Enables or disables blinking of the POWER LED indicator on the front panel.',
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

				const line = await (self as any).waitForLine(/^(Blink on|Blink off)$/i, 3000)
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

		display_button: {
			name: 'Display Button',
			description: 'Emulates pressing the DISPLAY button on the front panel.',
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
					self.log('info', 'Setting front panel DISPLAY button ON')
					self.sendCommand('DispBtn on')
					return
				}

				if (mode === 'off') {
					self.log('info', 'Setting front panel DISPLAY button OFF')
					self.sendCommand('DispBtn off')
					return
				}

				self.log('info', 'Querying device for DISPLAY button status')
				self.sendCommand('DispBtn sta')

				const line = await (self as any).waitForLine(/^(DispBtn on|DispBtn off)$/i, 3000)
				const status = line.trim()

				if (status === 'DispBtn on') {
					self.log('info', 'DISPLAY button is ON, turning OFF')
					self.sendCommand('DispBtn off')
				} else if (status === 'DispBtn off') {
					self.log('info', 'DISPLAY button is OFF, turning ON')
					self.sendCommand('DispBtn on')
				} else {
					self.log('warn', `Unexpected DISPLAY button response: ${line}`)
				}
			},
		},

		input_status: {
			name: 'Get Input Status',
			description: 'Displays the connection status of each input on the unit (e.g., HDMI, DisplayPort, etc.)',
			options: [],
			callback: async () => {
				try {
					self.log('info', 'Querying device for input status')
					self.sendCommand('InputStatus')

					const line = await (self as any).waitForLine(/^InputStatus\s*([01]{4})$/i, 3000)
					const m = line.match(/^InputStatus\s*([01]{4})$/i)
					if (!m) {
						self.log('warn', `Unexpected input status response: ${line}`)
						return
					}
					const bits = m[1]
					for (let i = 0; i < 4; i++) {
						const connected = bits.charAt(i) === '1'
						self.log('info', `Input ${i + 1} is ${connected ? 'connected.' : 'not connected.'}`)
					}
				} catch (err: any) {
					self.log('error', `Failed to retrieve input status: ${err?.message ?? err}`)
				}
			},
		},
		
		get_power_status: {
			name: 'Get Power Status',
			description: 'Displays the power state of the unit',
			options: [],
			callback: async () => {
				try {
					self.log('info', 'Querying device for power status (PWSTA)')
					self.sendCommand('PWSTA')

					const line = await (self as any).waitForLine(/^(PWON|PWOFF)$/i, 3000)
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
