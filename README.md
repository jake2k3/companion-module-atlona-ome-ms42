# companion-module-atlona-ome-ms42

Hello! This module is in pre-release development. Use at your own risk.

This Companion Module utilizes commands listed in the [Atlona AT-OME-MS42 API](https://ts.atlona.com/pdf/AT-OME-MS42_API.pdf) document. Other Atlona devices may use similar commands, though compatibilty cannot be verified for all models. 

See [HELP.md](./companion/HELP.md) and [LICENSE](./LICENSE)

## To-Do Before 1.0.0 Release
- Query device status on first connection to set initial state for all variables.
  - ~~Send 'Type' and 'Version' queries in this sequence~~
- Change password config to secret-text field
- Draft initial HELP.md document

## To-Do's After Release
- Define feedback for XY routing, USB logic, etc
- Generate presets for most often used buttons

## Possible?
- Create a dropdown to allow selection from multiple OME models (SW-32 for starters), and show/hide actions based on selection
- Advanced actions/commands
  - IP802.1x
  - IPDHCP
  - IPStatic
  - Mreset
  - RepCmdTime
  - RepeatCmd
  - RS232zone
