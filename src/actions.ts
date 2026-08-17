/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import type ModuleInstance from './main.js'
import type { VariablesSchema } from './variables.js'

export type ActionsSchema = {
	blink: { options: { mode: 'on' | 'off' | 'toggle' } }
	blink_status: { options: Record<string, never> }
	displayButton: { options: { mode: 'on' | 'off' | 'toggle' } }
	displayButton_status: { options: Record<string, never> }
	input_status: { options: Record<string, never> }
	lock: { options: Record<string, never> }
	lraud: { options: { mode: 'on' | 'off' } }
	lraud_status: { options: Record<string, never> }
	outHdmi5vKeep: { options: { mode: 'on' | 'off' } }
	outHdmi5vKeep_status: { options: Record<string, never> }
	pwon: { options: Record<string, never> }
	pwoff: { options: Record<string, never> }
	power_status: { options: Record<string, never> }
	reboot: { options: Record<string, never> }
	status: { options: Record<string, never> }
	unlock: { options: Record<string, never> }
	USBHostLogic: { options: { mode: 'follow usb' | 'follow video' | 'manual' } }
	USBHostLogic_status: { options: Record<string, never> }
	USBHostRoute: { options: { mode: 'C' | '1' | '2' | '3' } }
	USBHostRoute_status: { options: Record<string, never> }
	UsbVbusControl: { options: { mode: 'on' | 'off' } }
	UsbVbusControl_status: { options: Record<string, never> }
	VOUTMute: { options: { output: '1' | '2'; mode: 'on' | 'off' } }
	VOUTMute_status: { options: Record<string, never> }
	xY$: { options: { output: '1' | '2'; mode: 'on' | 'off' } }
	xY$_status: { options: Record<string, never> }
	xYAVxZ: { options: { input: '1' | '2' | '3' | '4'; output: '1' | '2' } }
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
					self.setVariableValues({ statusBlink: 'on' } as Partial<VariablesSchema>)
					return
				}

				if (mode === 'off') {
					self.log('info', 'Turning blink OFF')
					self.sendCommand('Blink off')
					self.setVariableValues({ statusBlink: 'off' } as Partial<VariablesSchema>)
					return
				}

				self.log('info', 'Querying device for blink status')
				self.sendCommand('Blink sta')

				const line = await (self as any).waitForLine(/^(Blink on|Blink off)$/i, 3000)
				const status = line.trim()

				if (status === 'Blink on') {
					self.log('info', 'Blink is ON, turning OFF')
					self.sendCommand('Blink off')
					self.setVariableValues({ statusBlink: 'off' } as Partial<VariablesSchema>)
				} else if (status === 'Blink off') {
					self.log('info', 'Blink is OFF, turning ON')
					self.sendCommand('Blink on')
					self.setVariableValues({ statusBlink: 'on' } as Partial<VariablesSchema>)
				} else {
					self.log('warn', `Unexpected blink response: ${line}`)
				}
			},
		},

		blink_status: {
			name: 'Get Blink Status',
			description: 'Displays the status of the blink function',
			options: [],
			callback: async () => {
				try {
					self.log('info', 'Querying device for blink status')
					self.sendCommand('Blink sta')

					const line = await (self as any).waitForLine(/^(Blink on|Blink off)$/i, 3000)
					const status = line.trim()

					if (status === 'Blink on') {
						self.log('info', 'Blink status is ON.')
						self.setVariableValues({ statusBlink: 'on' } as Partial<VariablesSchema>)
					} else if (status === 'Blink off') {
						self.log('info', 'Blink status is OFF.')
						self.setVariableValues({ statusBlink: 'off' } as Partial<VariablesSchema>)
					} else {
						self.log('warn', `Unexpected blink response: ${line}`)
					}
				} catch (err: any) {
					self.log('error', `Failed to retrieve blink status: ${err?.message ?? err}`)
				}
			},
		},

		displayButton: {
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

		displayButton_status: {
			name: 'Get DISPLAY Button Status',
			description: 'Displays the status of the DISPLAY button',
			options: [],
			callback: async () => {
				try {
					self.log('info', 'Querying device for DISPLAY button status')
					self.sendCommand('DispBtn sta')

					const line = await (self as any).waitForLine(/^(DispBtn on|DispBtn off)$/i, 3000)
					const status = line.trim()

					if (status === 'DispBtn on') {
						self.log('info', 'DISPLAY button is on.')
						self.setVariableValues({ statusDisplayButton: 'on' } as Partial<VariablesSchema>)
					} else if (status === 'DispBtn off') {
						self.log('info', 'DISPLAY button is off.')
						self.setVariableValues({ statusDisplayButton: 'off' } as Partial<VariablesSchema>)
					} else {
						self.log('warn', `Unexpected DISPLAY button response: ${line}`)
					}
				} catch (err: any) {
					self.log('error', `Failed to retrieve DISPLAY button status: ${err?.message ?? err}`)
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
					const names: Record<string, string> = {
						'1': 'USB-C',
						'2': 'DisplayPort',
						'3': 'HDMI 3',
						'4': 'HDMI 4',
					}

					for (let i = 0; i < 4; i++) {
						const connected = bits.charAt(i) === '1'
						const idx = (i + 1).toString()
						self.log('info', `Input ${i + 1} (${names[idx]}) is ${connected ? 'connected.' : 'not connected.'}`)
					}

					self.setVariableValues({
						input1Connected: bits.charAt(0) === '1' ? 'connected' : 'not-connected',
						input2Connected: bits.charAt(1) === '1' ? 'connected' : 'not-connected',
						input3Connected: bits.charAt(2) === '1' ? 'connected' : 'not-connected',
						input4Connected: bits.charAt(3) === '1' ? 'connected' : 'not-connected',
					} as Partial<VariablesSchema>)
				} catch (err: any) {
					self.log('error', `Failed to retrieve input status: ${err?.message ?? err}`)
				}
			},
		},

		lock: {
			name: 'Front Panel Lock',
			description: 'Locks the buttons on the front panel of the unit',
			options: [],
			callback: async () => {
				try {
					self.sendCommand('Lock')
					self.log('info', 'Front panel buttons locked')
				} catch (err: any) {
					self.log('error', `Failed to lock front panel buttons: ${err?.message ?? err}`)
				}
			},
		},

		lraud: {
			name: 'Analog Audio Output',
			description: 'Enables or disables the analog audio output.',
			options: [
				{
					id: 'mode',
					type: 'dropdown',
					label: 'Mode',
					default: 'on',
					choices: [
						{ id: 'on', label: 'On' },
						{ id: 'off', label: 'Off' },
					],
				},
			],
			callback: async (action) => {
				const mode = action.options.mode
				if (mode === 'on') {
					self.log('info', 'Analog audio output set to ON')
					self.sendCommand('LRAUD on')
					return
				}

				if (mode === 'off') {
					self.log('info', 'Analog audio output set to OFF')
					self.sendCommand('LRAUD off')
					return
				}
			},
		},

		lraud_status: {
			name: 'Get Analog Audio Output Status',
			description: 'Displays the status of the analog audio output',
			options: [],
			callback: async () => {
				try {
					self.log('info', 'Querying device for analog audio output status')
					self.sendCommand('LRAUD sta')

					const line = await (self as any).waitForLine(/^(LRAUD on|LRAUD off)$/i, 3000)
					const status = line.trim()

					if (status === 'LRAUD on') {
						self.log('info', 'Analog audio output status is on.')
						self.setVariableValues({ statusLRAUD: 'on' } as Partial<VariablesSchema>)
					} else if (status === 'LRAUD off') {
						self.log('info', 'Analog audio output status is off.')
						self.setVariableValues({ statusLRAUD: 'off' } as Partial<VariablesSchema>)
					} else {
						self.log('warn', `Unexpected analog audio output response: ${line}`)
					}
				} catch (err: any) {
					self.log('error', `Failed to retrieve analog audio output status: ${err?.message ?? err}`)
				}
			},
		},
		outHdmi5vKeep: {
			name: 'HDMI Output +5V',
			description: 'Sets the HDMI Output +5V to Always On / On When Signal Present.',
			options: [
				{
					id: 'mode',
					type: 'dropdown',
					label: 'Mode',
					default: 'on',
					choices: [
						{ id: 'on', label: 'Always On' },
						{ id: 'off', label: 'On When Signal Present' },
					],
				},
			],
			callback: async (action) => {
				const mode = action.options.mode
				if (mode === 'on') {
					self.log('info', 'HDMI output +5V set to Always On')
					self.sendCommand('OutHdmi5vKeep on')
					return
				}

				if (mode === 'off') {
					self.log('info', 'HDMI output +5V set to On When Signal Present')
					self.sendCommand('OutHdmi5vKeep off')
					return
				}
			},
		},

		outHdmi5vKeep_status: {
			name: 'Get HDMI Output +5V Status',
			description: 'Displays whether the HDMI Output +5V is set to Always On or On When Signal Present.',
			options: [],
			callback: async () => {
				try {
					self.log('info', 'Querying device for HDMI output +5V status (OutHdmi5vKeep)')
					self.sendCommand('OutHdmi5vKeep sta')

					const line = await (self as any).waitForLine(/^(OutHdmi5vKeep on|OutHdmi5vKeep off)$/i, 3000)
					const status = line.trim()

					if (status === 'OutHdmi5vKeep on') {
						self.log('info', 'HDMI output +5V status is on.')
						self.setVariableValues({ statusOutHdmi5vKeep: 'on' } as Partial<VariablesSchema>)
					} else if (status === 'OutHdmi5vKeep off') {
						self.log('info', 'HDMI output +5V status is off.')
						self.setVariableValues({ statusOutHdmi5vKeep: 'off' } as Partial<VariablesSchema>)
					} else {
						self.log('warn', `Unexpected HDMI output +5V response: ${line}`)
					}
				} catch (err: any) {
					self.log('error', `Failed to retrieve HDMI output +5V status: ${err?.message ?? err}`)
				}
			},
		},

		pwoff: {
			name: 'Power Off',
			description: 'Turns the unit off',
			options: [],
			callback: async () => {
				try {
					self.sendCommand('PWOFF')
					self.log('info', 'Unit powered off')
				} catch (err: any) {
					self.log('error', `Failed to power off the unit: ${err?.message ?? err}`)
				}
			},
		},

		pwon: {
			name: 'Power On',
			description: 'Turns the unit on',
			options: [],
			callback: async () => {
				try {
					self.sendCommand('PWON')
					self.log('info', 'Unit powered on')
				} catch (err: any) {
					self.log('error', `Failed to power on the unit: ${err?.message ?? err}`)
				}
			},
		},

		power_status: {
			name: 'Get Power Status',
			description: 'Displays the power state of the unit',
			options: [],
			callback: async () => {
				try {
					self.log('info', 'Querying device for power status')
					self.sendCommand('PWSTA')

					const line = await (self as any).waitForLine(/^(PWON|PWOFF)$/i, 3000)
					const status = line.trim().toUpperCase()

					if (status === 'PWON') {
						self.log('info', 'Power status: ON')
						self.setVariableValues({ statusPower: 'on' } as Partial<VariablesSchema>)
					} else if (status === 'PWOFF') {
						self.log('info', 'Power status: OFF')
						self.setVariableValues({ statusPower: 'off' } as Partial<VariablesSchema>)
					} else {
						self.log('warn', `Unexpected power response: ${line}`)
					}
				} catch (err: any) {
					self.log('error', `Failed to retrieve power status: ${err?.message ?? err}`)
				}
			},
		},

		reboot: {
			name: 'Reboot',
			description: 'Performs a soft reboot of the unit. All system settings are preserved.',
			options: [],
			callback: async () => {
				try {
					self.sendCommand('Reboot')
					self.log('info', 'Rebooting the unit')
				} catch (err: any) {
					self.log('error', `Failed to reboot the unit: ${err?.message ?? err}`)
				}
			},
		},

		status: {
			name: 'Get XY Routing Status',
			description: 'Displays which input is routed to which output on the unit.',
			options: [],
			callback: async () => {
				try {
					self.log('info', 'Querying device for XY routing status')
					self.sendCommand('Status')

					const line = await (self as any).waitForLine(/^x([1-4])AVx1\s*,\s*x([1-4])AVx2$/i, 3000)
					const m = line.match(/x([1-4])AVx1\s*,\s*x([1-4])AVx2/i)
					if (!m) {
						self.log('warn', `Unexpected XY routing response: ${line}`)
						return
					}
					const y = m[1]
					const z = m[2]
					const names: Record<string, string> = {
						'1': 'USB-C',
						'2': 'DisplayPort',
						'3': 'HDMI 3',
						'4': 'HDMI 4',
					}
					self.log('info', `Input ${y} (${names[y]}) is patched to Output 1 (HDMI).`)
					self.log('info', `Input ${z} (${names[z]}) is patched to Output 2 (HDBaseT).`)
					self.setVariableValues({
						routeOutput1: `${y}`,
						routeOutput2: `${z}`,
					} as Partial<VariablesSchema>)
				} catch (err: any) {
					self.log('error', `Failed to retrieve input status: ${err?.message ?? err}`)
				}
			},
		},

		unlock: {
			name: 'Front Panel Unlock',
			description: 'Unlocks the buttons on the front panel of the unit',
			options: [],
			callback: async () => {
				try {
					self.sendCommand('Unlock')
					self.log('info', 'Front panel buttons unlocked')
				} catch (err: any) {
					self.log('error', `Failed to unlock front panel buttons: ${err?.message ?? err}`)
				}
			},
		},

		USBHostLogic: {
			name: 'USB Host Logic',
			description: 'Sets the USB mode for the unit.',
			options: [
				{
					id: 'mode',
					type: 'dropdown',
					label: 'Mode',
					default: 'follow video',
					choices: [
						{ id: 'follow usb', label: 'Follow USB' },
						{ id: 'follow video', label: 'Follow Video' },
						{ id: 'manual', label: 'Manual (See "USBHostRoute" Action)' },
					],
				},
			],
			callback: async (action) => {
				const mode = action.options.mode
				if (mode === 'follow usb') {
					self.log('info', 'USB mode set to Follow USB')
					self.sendCommand('USBHostLogic follow usb')
					self.setVariableValues({ statusUsbHostLogic: 'follow-usb' } as Partial<VariablesSchema>)
					return
				}

				if (mode === 'follow video') {
					self.log('info', 'USB mode set to Follow Video')
					self.sendCommand('USBHostLogic follow video')
					self.setVariableValues({ statusUsbHostLogic: 'follow-video' } as Partial<VariablesSchema>)
					return
				}

				if (mode === 'manual') {
					self.log('info', 'USB mode set to Manual')
					self.sendCommand('USBHostLogic manual')
					self.setVariableValues({ statusUsbHostLogic: 'manual' } as Partial<VariablesSchema>)
					return
				}
			},
		},

		USBHostLogic_status: {
			name: 'Get USB Host Logic Status',
			description: 'Displays the USB host logic status',
			options: [],
			callback: async () => {
				try {
					self.log('info', 'Querying device for USB host logic status')
					self.sendCommand('USBHostLogic sta')

					const line = await (self as any).waitForLine(
						/^(USBHostLogic follow usb|USBHostLogic follow video|manual)$/i,
						3000,
					)
					const status = line.trim()

					if (status === 'USBHostLogic follow usb') {
						self.log('info', 'USB host logic status: Follow USB')
						self.setVariableValues({ statusUsbHostLogic: 'follow-usb' } as Partial<VariablesSchema>)
					} else if (status === 'USBHostLogic follow video') {
						self.log('info', 'USB host logic status: Follow Video')
						self.setVariableValues({ statusUsbHostLogic: 'follow-video' } as Partial<VariablesSchema>)
					} else if (status === 'USBHostLogic manual') {
						self.log('info', 'USB host logic status: Manual')
						self.setVariableValues({ statusUsbHostLogic: 'manual' } as Partial<VariablesSchema>)
					} else {
						self.log('warn', `Unexpected USB host logic response: ${line}`)
					}
				} catch (err: any) {
					self.log('error', `Failed to retrieve USB host logic status: ${err?.message ?? err}`)
				}
			},
		},

		USBHostRoute: {
			name: 'USB Host Route',
			description: 'Sets the routing state of the USB host.',
			options: [
				{
					id: 'mode',
					type: 'dropdown',
					label: 'Mode',
					default: 'C',
					choices: [
						{ id: 'C', label: 'USB-C port' },
						{ id: '1', label: 'USB Host 1' },
						{ id: '2', label: 'USB Host 2' },
						{ id: '3', label: 'HDBaseT Remote USB Host' },
					],
				},
			],
			callback: async (action) => {
				const mode = action.options.mode
				if (mode === 'C') {
					self.log('info', 'USB Host route set to USB-C port')
					self.sendCommand('USBHostRoute C')
					self.setVariableValues({ statusUSBHostRoute: 'C' } as Partial<VariablesSchema>)

					return
				}

				if (mode === '1') {
					self.log('info', 'USB Host route set to USB Host 1')
					self.sendCommand('USBHostRoute 1')
					self.setVariableValues({ statusUSBHostRoute: '1' } as Partial<VariablesSchema>)
					return
				}

				if (mode === '2') {
					self.log('info', 'USB Host route set to USB Host 2')
					self.sendCommand('USBHostRoute 2')
					self.setVariableValues({ statusUSBHostRoute: '2' } as Partial<VariablesSchema>)
					return
				}

				if (mode === '3') {
					self.log('info', 'USB Host route set to Remote USB Host connected over HDBaseT')
					self.sendCommand('USBHostRoute 3')
					self.setVariableValues({ statusUSBHostRoute: '3' } as Partial<VariablesSchema>)
					return
				}
			},
		},

		USBHostRoute_status: {
			name: 'Get USB Host Route Status',
			description: 'Displays the USB host routing status',
			options: [],
			callback: async () => {
				try {
					self.log('info', 'Querying device for USB host routing status')
					self.sendCommand('USBHostRoute sta')

					const line = await (self as any).waitForLine(
						/^(USBHostRoute C|USBHostRoute 1|USBHostRoute 2|USBHostRoute 3)$/i,
						3000,
					)
					const status = line.trim()

					if (status === 'USBHostRoute C') {
						self.log('info', 'USB host route status: USB-C port')
						self.setVariableValues({ statusUSBHostRoute: 'C' } as Partial<VariablesSchema>)
					} else if (status === 'USBHostRoute 1') {
						self.log('info', 'USB host route status: USB Host 1')
						self.setVariableValues({ statusUSBHostRoute: '1' } as Partial<VariablesSchema>)
					} else if (status === 'USBHostRoute 2') {
						self.log('info', 'USB host route status: USB Host 2')
						self.setVariableValues({ statusUSBHostRoute: '2' } as Partial<VariablesSchema>)
					} else if (status === 'USBHostRoute 3') {
						self.log('info', 'USB host route status: HDBaseT Remote USB Host')
						self.setVariableValues({ statusUSBHostRoute: '3' } as Partial<VariablesSchema>)
					} else {
						self.log('warn', `Unexpected USB host route response: ${line}`)
					}
				} catch (err: any) {
					self.log('error', `Failed to retrieve USB host route status: ${err?.message ?? err}`)
				}
			},
		},

		UsbVbusControl: {
			name: 'USB VBus Control',
			description: 'Sets the USB Hub port to always provide power, or follow the presence of the connected USB host.',
			options: [
				{
					id: 'mode',
					type: 'dropdown',
					label: 'Mode',
					default: 'on',
					choices: [
						{ id: 'on', label: 'Always High' },
						{ id: 'off', label: 'Follow the presence of USB Host' },
					],
				},
			],
			callback: async (action) => {
				const mode = action.options.mode
				if (mode === 'on') {
					self.log('info', 'USB VBus power set to Always High')
					self.sendCommand('UsbVbusControl on')
					self.setVariableValues({ statusUsbVbusControl: 'on' } as Partial<VariablesSchema>)

					return
				}

				if (mode === 'off') {
					self.log('info', 'USB VBus power set to Follow the presence of USB Host')
					self.sendCommand('UsbVbusControl off')
					self.setVariableValues({ statusUsbVbusControl: 'off' } as Partial<VariablesSchema>)
					return
				}
			},
		},

		UsbVbusControl_status: {
			name: 'Get USB VBus Control Status',
			description: 'Displays the USB VBus control status',
			options: [],
			callback: async () => {
				try {
					self.log('info', 'Querying device for USB VBus control status')
					self.sendCommand('UsbVbusControl sta')

					const line = await (self as any).waitForLine(/^(UsbVbusControl on|UsbVbusControl off)$/i, 3000)
					const status = line.trim()

					if (status === 'UsbVbusControl on') {
						self.log('info', 'USB VBus control status: Always High')
						self.setVariableValues({ statusUsbVbusControl: 'on' } as Partial<VariablesSchema>)
					} else if (status === 'UsbVbusControl off') {
						self.log('info', 'USB VBus control status: Follow the presence of USB Host')
						self.setVariableValues({ statusUsbVbusControl: 'off' } as Partial<VariablesSchema>)
					} else {
						self.log('warn', `Unexpected UsbVbusControl status response: ${line}`)
					}
				} catch (err: any) {
					self.log('error', `Failed to retrieve UsbVbusControl status: ${err?.message ?? err}`)
				}
			},
		},

		VOUTMute: {
			name: 'Output Audio Mute',
			description: 'Mutes/unmutes the audio output for the HDMI or HDBaseT outputs.',
			options: [
				{
					id: 'output',
					type: 'dropdown',
					label: 'Output',
					default: '1',
					choices: [
						{ id: '1', label: '1 - HDMI' },
						{ id: '2', label: '2 - HDBaseT' },
					],
				},
				{
					id: 'mode',
					type: 'dropdown',
					label: 'State',
					default: 'on',
					choices: [
						{ id: 'on', label: 'Mute' },
						{ id: 'off', label: 'Unmute' },
					],
				},
			],
			callback: async (action) => {
				try {
					const output = action.options.output
					const mode = action.options.mode
					const names: Record<string, string> = {
						'1': 'HDMI',
						'2': 'HDBaseT',
					}

					self.log('info', `Output ${output} (${names[output]}) set to ${mode}`)
					self.sendCommand(`VOUTMute${output} ${mode}`)
					self.setVariableValues({ [`statusVOUTMute${output}`]: mode } as Partial<VariablesSchema>)
				} catch (err: any) {
					self.log('error', `Failed to set audio output mute: ${err?.message ?? err}`)
				}
			},
		},

		VOUTMute_status: {
			name: 'Get Output Volume Mute Status',
			description: 'Displays the output volume mute status',
			options: [],
			callback: async () => {
				try {
					self.log('info', 'Querying device for output volume mute status')
					self.sendCommand('VOUTMute1 sta')

					const line1 = await (self as any).waitForLine(/^(VOUTMute1 on|VOUTMute1 off)$/i, 3000)
					const status1 = line1.trim()

					if (status1 === 'VOUTMute1 on') {
						self.log('info', 'Output 1 volume mute status: MUTED')
						self.setVariableValues({ statusVOUTMute1: 'on' } as Partial<VariablesSchema>)
					} else if (status1 === 'VOUTMute1 off') {
						self.log('info', 'Output 1 volume mute status: UNMUTED')
						self.setVariableValues({ statusVOUTMute1: 'off' } as Partial<VariablesSchema>)
					} else {
						self.log('warn', `Unexpected VOUTMute1 status response: ${line1}`)
					}

					self.sendCommand('VOUTMute2 sta')

					const line2 = await (self as any).waitForLine(/^(VOUTMute2 on|VOUTMute2 off)$/i, 3000)
					const status2 = line2.trim()

					if (status2 === 'VOUTMute2 on') {
						self.log('info', 'Output 2 volume mute status: MUTED')
						self.setVariableValues({ statusVOUTMute2: 'on' } as Partial<VariablesSchema>)
					} else if (status2 === 'VOUTMute2 off') {
						self.log('info', 'Output 2 volume mute status: UNMUTED')
						self.setVariableValues({ statusVOUTMute2: 'off' } as Partial<VariablesSchema>)
					} else {
						self.log('warn', `Unexpected VOUTMute2 status response: ${line2}`)
					}
				} catch (err: any) {
					self.log('error', `Failed to retrieve VOUTMute status: ${err?.message ?? err}`)
				}
			},
		},

		xY$: {
			name: 'xY$',
			description: 'Enables/disables video for the specified output.',
			options: [
				{
					id: 'output',
					type: 'dropdown',
					label: 'Output',
					default: '1',
					choices: [
						{ id: '1', label: 'HDMI' },
						{ id: '2', label: 'HDBaseT' },
					],
				},
				{
					id: 'mode',
					type: 'dropdown',
					label: 'State',
					default: 'on',
					choices: [
						{ id: 'on', label: 'Enable video' },
						{ id: 'off', label: 'Disable video' },
					],
				},
			],
			callback: async (action) => {
				try {
					const output = action.options.output
					const mode = action.options.mode
					const names: Record<string, string> = {
						'1': 'HDMI',
						'2': 'HDBaseT',
					}

					self.log('info', `Output ${output} (${names[output]}) set to ${mode}`)
					self.sendCommand(`x${output}$ ${mode}`)
				} catch (err: any) {
					self.log('error', `Failed to set video enablement: ${err?.message ?? err}`)
				}
			},
		},

		xY$_status: {
			name: 'Get output enablement status',
			description: 'Retrieves whether Outputs 1 and 2 are enabled',
			options: [],
			callback: async () => {
				try {
					self.sendCommand('x1$ sta')
					const line1 = await (self as any).waitForLine(/^x1\$\s*(on|off)$/i, 3000)
					const m1 = line1.match(/^x1\$\s*(on|off)$/i)
					if (!m1) {
						self.log('warn', `Unexpected response for x1$: ${line1}`)
					}
					const y = m1 ? m1[1].toLowerCase() : 'off'

					self.sendCommand('x2$ sta')
					const line2 = await (self as any).waitForLine(/^x2\$\s*(on|off)$/i, 3000)
					const m2 = line2.match(/^x2\$\s*(on|off)$/i)
					if (!m2) {
						self.log('warn', `Unexpected response for x2$: ${line2}`)
					}
					const z = m2 ? m2[1].toLowerCase() : 'off'

					self.log('info', `Output 1 is ${y.toUpperCase()} ; Output 2 is ${z.toUpperCase()}`)
					self.setVariableValues({
						output1Enabled: `${y}`,
						output2Enabled: `${z}`,
					} as Partial<VariablesSchema>)
				} catch (err: any) {
					self.log('error', `Failed to retrieve output enablement status: ${err?.message ?? err}`)
				}
			},
		},

		xYAVxZ: {
			name: 'XY Routing',
			description: 'Sets which input (1-4) is patched to which output (1-2).',
			options: [
				{
					id: 'input',
					type: 'dropdown',
					label: 'Input',
					default: '1',
					choices: [
						{ id: '1', label: '1 - USB-C' },
						{ id: '2', label: '2 - DisplayPort' },
						{ id: '3', label: '3 - HDMI 3' },
						{ id: '4', label: '4 - HDMI 4' },
					],
				},
				{
					id: 'output',
					type: 'dropdown',
					label: 'Output',
					default: '1',
					choices: [
						{ id: '1', label: '1 - HDMI' },
						{ id: '2', label: '2 - HDBaseT' },
					],
				},
			],
			callback: async (action) => {
				try {
					const input = action.options.input
					const output = action.options.output
					const names: Record<string, string> = {
						'1': 'USB-C',
						'2': 'DisplayPort',
						'3': 'HDMI 3',
						'4': 'HDMI 4',
					}

					if (!/^[1-4]$/.test(input) || !/^[1-2]$/.test(output)) {
						self.log('warn', `Invalid input/output selection: ${input}/${output}`)
						return
					}

					self.log('info', `Routing Input ${input} (${names[input]}) to Output ${output}`)
					self.sendCommand(`x${input}AVx${output}`)
				} catch (err: any) {
					self.log('error', `Failed to set routing: ${err?.message ?? err}`)
				}
			},
		},
	})
}
