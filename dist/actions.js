export function UpdateActions(self) {
    self.setActionDefinitions({
        get_power_status: {
            name: 'Get Power Status',
            options: [],
            callback: async (event) => {
                try {
                    self.log('info', 'Querying device for power status (PWSTAT)');
                    self.sendCommand('PWSTAT');
                    // Wait for a response line matching PWON or PWOFF, 1sec timeout
                    const line = await self.waitForLine(/^(PWON|PWOFF)$/i, 1000);
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
    });
}
//# sourceMappingURL=actions.js.map