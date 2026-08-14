import type ModuleInstance from './main.js'

export type VariablesSchema = {
	input1Connected: string
	input2Connected: string
	input3Connected: string
	input4Connected: string
	output1Enabled: string
	output2Enabled: string
	routeOutput1: string
	routeOutput2: string
	statusBlink: string
	statusLRAUD: string
	statusPower: string
	statusUsbHostLogic: string
	statusUsbHostRoute: string
	statusUsbVbusControl: string
	statusVOUTMute1: string
	statusVOUTMute2: string
	type: string
	version: string
}

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	self.setVariableDefinitions({
		input1Connected: { name: 'Input 1 Connection Status' },
		input2Connected: { name: 'Input 2 Connection Status' },
		input3Connected: { name: 'Input 3 Connection Status' },
		input4Connected: { name: 'Input 4 Connection Status' },
		output1Enabled: { name: 'Output 1 Enable Status' },
		output2Enabled: { name: 'Output 2 Enable Status' },
		routeOutput1: { name: 'Output 1 Route Status' },
		routeOutput2: { name: 'Output 2 Route Status' },
		statusBlink: { name: 'Blink status' },
		statusLRAUD: { name: 'Analog Audio Output status' },
		statusPower: { name: 'Power status' },
		statusUsbHostLogic: { name: 'USB Host Logic status' },
		statusUsbHostRoute: { name: 'USB Host Route status' },
		statusUsbVbusControl: { name: 'USB VBus Power status' },
		statusVOUTMute1: { name: 'HDMI Audio Output status' },
		statusVOUTMute2: { name: 'HDBaseT Audio Output status' },
		type: { name: 'Model of the unit' },
		version: { name: 'Current firmware version of the unit' },
	})
}
