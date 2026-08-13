# companion-module-atlona-ome-ms42

This Companion Module utilizes commands listed in the [Atlona AT-OME-MS42 API](https://ts.atlona.com/pdf/AT-OME-MS42_API.pdf) document. Other Atlona devices may use similar commands, though compatibilty cannot be verified for all models. 

See [HELP.md](./companion/HELP.md) and [LICENSE](./LICENSE)

## To-Do's
- Create local variables for storing API responses (eg. Power Status, I/O routing, etc)
- Query device status on first connection to set initial state for all variables.
- test if PWOFF closes the connection, or if unit can be subsequently sent PWON
- Define feedback for XY routing, USB logic, etc
- Change password config to secret-text field
- Draft initial HELP.md document
- Generate presets for most often used buttons

## Possible?
- Create a dropdown to allow selection from multiple OME models (SW-32 for starters), and show/hide actions based on selection
- Advanced actions/commands
  - IP802.1x
  - IPDHCP
  - IPStatic
  - Mreset
  - OutHdmi5vKeep
  - RepCmdTime
  - RepeatCmd
  - RS232zone
