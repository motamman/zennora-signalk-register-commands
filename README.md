# SignalK Dynamic Command Registration Plugin

**Version 0.5.0-alpha.1**

A SignalK plugin that allows dynamic registration of new command paths at runtime, enabling external applications to create PUT-enabled command paths without requiring Node-RED flows or server restarts.

## Description

This plugin solves the problem of creating new command paths in SignalK programmatically. Normally, PUT-enabled command paths (like `vessels.self.commands.captureWeather`) must be registered server-side through Node-RED flows or plugins. This plugin provides HTTP API endpoints that allow external applications to register new command paths dynamically.

## Features

- **Dynamic Command Registration**: Register new `commands.*` paths via HTTP API or web UI
- **Web Configuration Interface**: User-friendly admin interface for managing commands
- **PUT Handler Creation**: Automatically creates PUT handlers for registered commands
- **Command Listing**: View all registered commands via API or web interface
- **Persistent Configuration**: Commands persist through server restarts
- **Signal K Integration**: Properly emits delta messages with boolean units metadata
- **No Restart Required**: Commands can be registered while the server is running
- **Proper Data Tree Integration**: Commands appear immediately in SignalK data browser

## Installation

### Method 1: User Plugin Directory (Recommended)

1. Create the user plugins directory:
   ```bash
   mkdir -p ~/.signalk/node_modules
   ```

2. Copy the plugin to the user directory:
   ```bash
   cp -r zennora-signalk-register-commands ~/.signalk/node_modules/
   ```

3. Restart SignalK server:
   ```bash
   sudo systemctl restart signalk
   ```

### Method 2: System Plugin Directory

1. Copy to system plugins:
   ```bash
   sudo cp -r zennora-signalk-register-commands /usr/lib/node_modules/
   ```

2. Restart SignalK server:
   ```bash
   sudo systemctl restart signalk
   ```

## Configuration

1. Navigate to SignalK Admin UI: `https://your-server:3443/admin/`
2. Go to **Server Configuration → Plugins**
3. Find "Zennora Command Registration" and enable it
4. Click **Configure** to access the web interface for managing commands
5. Use the configuration interface to add/remove commands as needed

## Web Configuration Interface

The plugin provides a user-friendly web interface for managing commands:

### Adding Commands
1. Navigate to the plugin configuration page
2. Enter the command name in the "Add New Command" field (e.g., `captureWeather`)
3. Click **Submit** to register the command
4. The command will appear in the "Currently Registered Commands" list
5. Commands are immediately available at `vessels.self.commands.{commandName}`

### Removing Commands
1. Find the command in the "Currently Registered Commands" list
2. Click the **X** button next to the command you want to remove
3. Click **Submit** to commit the changes
4. **Note**: Server restart required to fully unregister PUT handlers

### Command Properties
Each registered command displays:
- **Command Name**: The short name (e.g., `captureWeather`)
- **Full Path**: Complete SignalK path (e.g., `vessels.self.commands.captureWeather`)
- **Registered**: Timestamp when the command was first registered

## API Endpoints

### Register a New Command

**POST** `/plugin-api/register-command`

Register a new command path that can accept PUT requests.

**Request Body:**
```json
{
  "command": "commandName"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Command commandName registered successfully",
  "path": "commands.commandName"
}
```

**Example:**
```bash
curl -X POST https://your-server:3443/plugin-api/register-command \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"command": "captureOneLove"}'
```

### List Registered Commands

**GET** `/plugin-api/commands`

Retrieve a list of all registered commands.

**Response:**
```json
{
  "commands": ["commands.captureWeather", "commands.captureOneLove"],
  "count": 2
}
```

**Example:**
```bash
curl -X GET https://your-server:3443/plugin-api/commands \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Remove a Command

**DELETE** `/plugin-api/commands/{commandName}`

Remove a previously registered command from the system.

**Response:**
```json
{
  "success": true,
  "message": "Command captureOneLove removed successfully",
  "path": "commands.captureOneLove"
}
```

**Example:**
```bash
curl -X DELETE https://your-server:3443/plugin-api/commands/captureOneLove \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Note**: Server restart required to fully unregister PUT handlers.

## Usage Example

### Python Example

```python
import requests
import websocket
import json
import uuid

# Configuration
BASE_URL = "https://your-server:3443"
TOKEN = "YOUR_TOKEN"
COMMAND_NAME = "captureOneLove"  # Change this to test different commands
COMMAND_PATH = f"commands.{COMMAND_NAME}"

# 1. Register a new command
response = requests.post(
    f"{BASE_URL}/plugin-api/register-command",
    json={"command": COMMAND_NAME},
    headers={"Authorization": f"Bearer {TOKEN}"},
    verify=False
)

print(response.json())
# Output: {"success": true, "message": "Command captureOneLove registered successfully", "path": "commands.captureOneLove"}

# 2. Use WebSocket to send PUT requests to the new command
ws_url = f"wss://your-server:3443/signalk/v1/stream?subscribe=none&token={TOKEN}"

def on_open(ws):
    # Send PUT request via WebSocket
    delta_msg = {
        "context": "vessels.self",
        "requestId": str(uuid.uuid4()),
        "put": {
            "path": COMMAND_PATH,
            "value": True,
            "meta": {"units": "bool"}
        }
    }
    print(f"Sending PUT to {COMMAND_PATH}")
    ws.send(json.dumps(delta_msg))

ws = websocket.WebSocketApp(ws_url, on_open=on_open)
ws.run_forever()
```

### Jupyter Notebook Example

A complete test notebook (`test_plugin_working.ipynb`) is included that demonstrates:

1. **Variable Configuration**: Set `COMMAND_NAME` once and use throughout
2. **Command Registration**: Register new commands via API
3. **Command Listing**: View all registered commands
4. **WebSocket Testing**: Send PUT requests to registered commands
5. **Response Handling**: Monitor SignalK responses

To test different commands, simply change the `COMMAND_NAME` variable in the first cell:

```python
COMMAND_NAME = "captureWeather"  # or any other command name
COMMAND_PATH = f"commands.{COMMAND_NAME}"
```

## How It Works

1. **Registration**: When you POST to `/plugin-api/register-command`, the plugin calls SignalK's `app.registerPutHandler()` method
2. **PUT Handling**: The registered handler receives PUT requests and emits them as SignalK delta messages
3. **Data Flow**: Commands appear in the SignalK data tree under `vessels.self.commands.*`
4. **Integration**: Other plugins, displays, and applications can subscribe to these command changes

## Authentication

All API endpoints require proper SignalK authentication:

- **Token Authentication**: Include `Authorization: Bearer YOUR_TOKEN` header
- **Cookie Authentication**: Use session cookies from SignalK login
- **Permissions**: Requires write access to `vessels.self.commands.*` paths

## Troubleshooting

### Plugin Not Loading
- Check plugin appears in Admin UI under Server Configuration → Plugins
- Verify plugin files are in correct directory
- Check SignalK logs: `sudo journalctl -u signalk -f`

### API Endpoints Return 404
- Ensure plugin is enabled in Admin UI
- Restart SignalK server after installation
- Verify plugin startup in logs

### PUT Requests Fail
- Confirm command was registered successfully
- Check authentication token has proper permissions
- Use WebSocket for PUT requests, not HTTP API

### Commands Not Appearing in Data Tree
- Commands appear after first PUT request is sent
- Check SignalK data browser at `/admin/#/data/browse`
- Verify delta messages are being emitted in logs

## Development

To modify or extend the plugin:

1. Edit `index.js` with your changes
2. Restart SignalK: `sudo systemctl restart signalk`
3. Check logs for errors: `sudo journalctl -u signalk -f`

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
1. Check SignalK server logs for errors
2. Verify plugin configuration in Admin UI
3. Test API endpoints with curl or similar tools
4. Review SignalK plugin development documentation