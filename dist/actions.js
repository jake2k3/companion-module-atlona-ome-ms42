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
                    return;
                }
                if (mode === 'off') {
                    self.log('info', 'Turning blink OFF');
                    self.sendCommand('Blink off');
                    return;
                }
                self.log('info', 'Querying device for blink status');
                self.sendCommand('Blink sta');
                const line = await self.waitForLine(/^(Blink on|Blink off)$/i, 3000);
                const status = line.trim();
                if (status === 'Blink on') {
                    self.log('info', 'Blink is ON, turning OFF');
                    self.sendCommand('Blink off');
                }
                else if (status === 'Blink off') {
                    self.log('info', 'Blink is OFF, turning ON');
                    self.sendCommand('Blink on');
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
                    for (let i = 0; i < 4; i++) {
                        const connected = bits.charAt(i) === '1';
                        self.log('info', `Input ${i + 1} is ${connected ? 'connected.' : 'not connected.'}`);
                    }
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
            name: 'LRAUD',
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
                    self.log('info', 'Enables analog audio output');
                    self.sendCommand('LRAUD on');
                    return;
                }
                if (mode === 'off') {
                    self.log('info', 'Disables analog audio output');
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
    });
}
//# sourceMappingURL=actions.js.map