# companion-module-atlona-ome-ms42

This Companion Module utilizes commands listed in the [Atlona AT-OME-MS42 API](https://ts.atlona.com/pdf/AT-OME-MS42_API.pdf) document. Other Atlona devices may use similar commands, though compatibilty cannot be verified for all models. 

See [HELP.md](./companion/HELP.md) and [LICENSE](./LICENSE)

## To-Do's
- Complete list of basic actions/status commands as listed in the API
  - ~~Blink~~
  - ~~DispBtn~~
  - ~~InputStatus~~
  - ~~Lock / Unlock~~
  - ~~LRAUD~~
  - PWOFF / PWON / ~~PWSTA~~
  - ~~Reboot~~
  - Status
  - Type / Version / IPCFG
  - USBHostLogic
  - USBHostRoute
  - UsbVbusControl
  - VOUTMute
  - xY$
  - xYAVxZ
- Create local variables for storing API responses (eg. Power Status, I/O routing, etc)
- Create intuitive variables for InputStatus (eg. USBC: Connected, DisplayPort: NotConnected)
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
  - ReapeatCmd
  - RS232zone
