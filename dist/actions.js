export function UpdateActions(self) {
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
                const mode = action.options.mode;
                if (mode === 'on') {
                    self.log('info', 'Turning blink ON');
                    self.sendCommand('Blink on');
                    self.setVariableValues({ statusBlink: 'on' });
                    return;
                }
                if (mode === 'off') {
                    self.log('info', 'Turning blink OFF');
                    self.sendCommand('Blink off');
                    self.setVariableValues({ statusBlink: 'off' });
                    return;
                }
                self.log('info', 'Querying device for blink status');
                self.sendCommand('Blink sta');
                const line = await self.waitForLine(/^(Blink on|Blink off)$/i, 3000);
                const status = line.trim();
                if (status === 'Blink on') {
                    self.log('info', 'Blink is ON, turning OFF');
                    self.sendCommand('Blink off');
                    self.setVariableValues({ statusBlink: 'off' });
                }
                else if (status === 'Blink off') {
                    self.log('info', 'Blink is OFF, turning ON');
                    self.sendCommand('Blink on');
                    self.setVariableValues({ statusBlink: 'on' });
                }
                else {
                    self.log('warn', `Unexpected blink response: ${line}`);
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
                const mode = action.options.mode;
                if (mode === 'on') {
                    self.log('info', 'Setting front panel DISPLAY button ON');
                    self.sendCommand('DispBtn on');
                    return;
                }
                if (mode === 'off') {
                    self.log('info', 'Setting front panel DISPLAY button OFF');
                    self.sendCommand('DispBtn off');
                    return;
                }
                self.log('info', 'Querying device for DISPLAY button status');
                self.sendCommand('DispBtn sta');
                const line = await self.waitForLine(/^(DispBtn on|DispBtn off)$/i, 3000);
                const status = line.trim();
                if (status === 'DispBtn on') {
                    self.log('info', 'DISPLAY button is ON, turning OFF');
                    self.sendCommand('DispBtn off');
                }
                else if (status === 'DispBtn off') {
                    self.log('info', 'DISPLAY button is OFF, turning ON');
                    self.sendCommand('DispBtn on');
                }
                else {
                    self.log('warn', `Unexpected DISPLAY button response: ${line}`);
                }
            },
        },
        input_status: {
            name: 'Get Input Status',
            description: 'Displays the connection status of each input on the unit (e.g., HDMI, DisplayPort, etc.)',
            options: [],
            callback: async () => {
                try {
                    self.log('info', 'Querying device for input status');
                    self.sendCommand('InputStatus');
                    const line = await self.waitForLine(/^InputStatus\s*([01]{4})$/i, 3000);
                    const m = line.match(/^InputStatus\s*([01]{4})$/i);
                    if (!m) {
                        self.log('warn', `Unexpected input status response: ${line}`);
                        return;
                    }
                    const bits = m[1];
                    const names = {
                        '1': 'USB-C',
                        '2': 'DisplayPort',
                        '3': 'HDMI 3',
                        '4': 'HDMI 4',
                    };
                    for (let i = 0; i < 4; i++) {
                        const connected = bits.charAt(i) === '1';
                        const idx = (i + 1).toString();
                        self.log('info', `Input ${i + 1} (${names[idx]}) is ${connected ? 'connected.' : 'not connected.'}`);
                    }
                    self.setVariableValues({
                        input1Connected: bits.charAt(0) === '1' ? 'connected' : 'not connected',
                        input2Connected: bits.charAt(1) === '1' ? 'connected' : 'not connected',
                        input3Connected: bits.charAt(2) === '1' ? 'connected' : 'not connected',
                        input4Connected: bits.charAt(3) === '1' ? 'connected' : 'not connected',
                    });
                }
                catch (err) {
                    self.log('error', `Failed to retrieve input status: ${err?.message ?? err}`);
                }
            },
        },
        lock: {
            name: 'Front Panel Lock',
            description: 'Locks the buttons on the front panel of the unit',
            options: [],
            callback: async () => {
                try {
                    self.sendCommand('Lock');
                    self.log('info', 'Front panel buttons locked');
                }
                catch (err) {
                    self.log('error', `Failed to lock front panel buttons: ${err?.message ?? err}`);
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
                const mode = action.options.mode;
                if (mode === 'on') {
                    self.log('info', 'Analog audio output set to ON');
                    self.sendCommand('LRAUD on');
                    return;
                }
                if (mode === 'off') {
                    self.log('info', 'Analog audio output set to OFF');
                    self.sendCommand('LRAUD off');
                    return;
                }
            },
        },
        power_status: {
            name: 'Get Power Status',
            description: 'Displays the power state of the unit',
            options: [],
            callback: async () => {
                try {
                    self.log('info', 'Querying device for power status (PWSTA)');
                    self.sendCommand('PWSTA');
                    const line = await self.waitForLine(/^(PWON|PWOFF)$/i, 3000);
                    const status = line.trim().toUpperCase();
                    self.setVariableValues({ statusPower: `${status}` });
                    if (status === 'PWON') {
                        self.log('info', 'Power status: ON (PWON)');
                    }
                    else if (status === 'PWOFF') {
                        self.log('info', 'Power status: OFF (PWOFF)');
                    }
                    else {
                        self.log('warn', `Unexpected power response: ${line}`);
                    }
                }
                catch (err) {
                    self.log('error', `Failed to retrieve power status: ${err?.message ?? err}`);
                }
            },
        },
        reboot: {
            name: 'Reboot',
            description: 'Performs a soft reboot of the unit. All system settings are preserved.',
            options: [],
            callback: async () => {
                try {
                    self.sendCommand('Reboot');
                    self.log('info', 'Rebooting the unit');
                }
                catch (err) {
                    self.log('error', `Failed to reboot the unit: ${err?.message ?? err}`);
                }
            },
        },
        status: {
            name: 'Get XY Routing Status',
            description: 'Displays which input is routed to which output on the unit.',
            options: [],
            callback: async () => {
                try {
                    self.log('info', 'Querying device for XY routing status');
                    self.sendCommand('Status');
                    const line = await self.waitForLine(/^x([1-4])AVx1\s*,\s*x([1-4])AVx2$/i, 3000);
                    const m = line.match(/x([1-4])AVx1\s*,\s*x([1-4])AVx2/i);
                    if (!m) {
                        self.log('warn', `Unexpected XY routing response: ${line}`);
                        return;
                    }
                    const y = m[1];
                    const z = m[2];
                    const names = {
                        '1': 'USB-C',
                        '2': 'DisplayPort',
                        '3': 'HDMI 3',
                        '4': 'HDMI 4',
                    };
                    self.log('info', `Input ${y} (${names[y]}) is patched to Output 1 (HDMI).`);
                    self.log('info', `Input ${z} (${names[z]}) is patched to Output 2 (HDBaseT).`);
                    self.setVariableValues({
                        routeOutput1: `${y}`,
                        routeOutput2: `${z}`,
                    });
                }
                catch (err) {
                    self.log('error', `Failed to retrieve input status: ${err?.message ?? err}`);
                }
            },
        },
        unlock: {
            name: 'Front Panel Unlock',
            description: 'Unlocks the buttons on the front panel of the unit',
            options: [],
            callback: async () => {
                try {
                    self.sendCommand('Unlock');
                    self.log('info', 'Front panel buttons unlocked');
                }
                catch (err) {
                    self.log('error', `Failed to unlock front panel buttons: ${err?.message ?? err}`);
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
                const mode = action.options.mode;
                if (mode === 'follow usb') {
                    self.log('info', 'USB mode set to Follow USB');
                    self.sendCommand('USBHostLogic follow usb');
                    return;
                }
                if (mode === 'follow video') {
                    self.log('info', 'USB mode set to Follow Video');
                    self.sendCommand('USBHostLogic follow video');
                    return;
                }
                if (mode === 'manual') {
                    self.log('info', 'USB mode set to Manual');
                    self.sendCommand('USBHostLogic manual');
                    return;
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
                const mode = action.options.mode;
                if (mode === 'C') {
                    self.log('info', 'USB route set to USB-C port');
                    self.sendCommand('USBHostRoute C');
                    return;
                }
                if (mode === '1') {
                    self.log('info', 'USB route set to USB Host 1');
                    self.sendCommand('USBHostRoute 1');
                    return;
                }
                if (mode === '2') {
                    self.log('info', 'USB route set to USB Host 2');
                    self.sendCommand('USBHostRoute 2');
                    return;
                }
                if (mode === '3') {
                    self.log('info', 'USB route set to Remote USB Host connected over HDBaseT');
                    self.sendCommand('USBHostRoute 3');
                    return;
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
                const mode = action.options.mode;
                if (mode === 'on') {
                    self.log('info', 'USB VBus power set to Always High');
                    self.sendCommand('UsbVbusControl on');
                    return;
                }
                if (mode === 'off') {
                    self.log('info', 'USB VBus power set to Follow the presence of USB Host');
                    self.sendCommand('UsbVbusControl off');
                    return;
                }
            },
        },
        VOUTMute: {
            name: 'Output Volume Mute',
            description: 'Mutes/unmutes the output volume for the specified output.',
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
                    const output = action.options.output;
                    const mode = action.options.mode;
                    const names = {
                        '1': 'HDMI',
                        '2': 'HDBaseT',
                    };
                    self.log('info', `Output ${output} (${names[output]}) set to ${mode}`);
                    self.sendCommand(`VOUTMute${output} ${mode}`);
                }
                catch (err) {
                    self.log('error', `Failed to set Output volume mute: ${err?.message ?? err}`);
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
                    const output = action.options.output;
                    const mode = action.options.mode;
                    const names = {
                        '1': 'HDMI',
                        '2': 'HDBaseT',
                    };
                    self.log('info', `Output ${output} (${names[output]}) set to ${mode}`);
                    self.sendCommand(`x${output}$ ${mode}`);
                }
                catch (err) {
                    self.log('error', `Failed to set video enablement: ${err?.message ?? err}`);
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
                    const input = action.options.input;
                    const output = action.options.output;
                    const names = {
                        '1': 'USB-C',
                        '2': 'DisplayPort',
                        '3': 'HDMI 3',
                        '4': 'HDMI 4',
                    };
                    if (!/^[1-4]$/.test(input) || !/^[1-2]$/.test(output)) {
                        self.log('warn', `Invalid input/output selection: ${input}/${output}`);
                        return;
                    }
                    self.log('info', `Routing Input ${input} (${names[input]}) to Output ${output}`);
                    self.sendCommand(`x${input}AVx${output}`);
                }
                catch (err) {
                    self.log('error', `Failed to set routing: ${err?.message ?? err}`);
                }
            },
        },
    });
}
//# sourceMappingURL=actions.js.map