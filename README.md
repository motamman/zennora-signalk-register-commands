# SignalK Dynamic Command Registration Plugin

**Version 0.5.0-alpha.1**

A SignalK plugin that enables bespoke registration of new command paths at runtime, allowing external applications to use  PUT-enabled command paths.

## Overview

This plugin creates new command paths in SignalK programmatically. Normally, PUT-enabled command paths (like `vessels.self.commands.captureWeather`) must be registered server-side through Node-RED flows or other plugins. This plugin provides dedicated HTTP API endpoints for bespoke command registration.

## Features

- **Dynamic Command Registration**: Register new `commands.*` paths via HTTP API or web UI
- **PUT Handler Creation**: Automatically creates PUT handlers for registered commands
- **Persistent Configuration**: Commands persist through server restarts
- **SignalK Integration**: Properly emits delta messages with boolean units metadata
- **No Restart Required**: Commands can be registered while the server is running
- **Data Tree Integration**: Commands appear immediately in SignalK data browser

## Installation

1. Navigate to your SignalK directory:
   ```bash
   cd ~/.signalk
   ```

2. Install the plugin:
   ```bash
   npm install motamman/zennora-signalk-register-commands
   ```

3. Restart your SignalK server:
   ```bash
   sudo systemctl restart signalk
   ```

### Adding Commands
1. Enter the command name in the "Add New Command" field (e.g., `captureWeather`)
2. Click **Submit** to register the command
3. Commands are immediately available at `vessels.self.commands.{commandName}`

### Removing Commands
1. Click the **X** button next to the command in the list
2. Click **Submit** to commit changes
3. **Note**: Server restart required to fully unregister PUT handlers

## Development

To modify the plugin:

1. Edit `index.js` with your changes
2. Restart SignalK: `sudo systemctl restart signalk`
3. Check logs for errors: `sudo journalctl -u signalk -f`

## License

MIT License - See LICENSE file for details
