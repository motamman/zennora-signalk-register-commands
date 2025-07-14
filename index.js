module.exports = function(app) {
  let plugin = {};
  let registeredCommands = new Set();
  let commandMetadata = new Map(); // Store additional info about commands

  plugin.id = 'zennora-signalk-register-commands';
  plugin.name = 'Zennora Command Registration';
  plugin.description = 'Allows dynamic registration of new command paths';

  plugin.start = function(options) {
    app.debug('Starting Zennora Dynamic Command Registration plugin');
    
    // Helper function to register a new command
    const registerNewCommand = (commandName) => {
      const commandPath = `commands.${commandName}`;
      
      if (!registeredCommands.has(commandPath)) {
        // Register the PUT handler
        app.registerPutHandler('vessels.self', commandPath, commandHandler, 'zennora-commands');
        
        // Create the initial data path with a default value
        app.handleMessage(null, {
          context: 'vessels.self',
          updates: [{
            source: {
              label: "zennora-signalk-register-commands"
            },
            timestamp: new Date().toISOString(),
            values: [{
              path: commandPath,
              value: false
            }],
            meta: [{
              path: commandPath,
              value: {
                units: 'bool',
                description: `Command: ${commandName}`
              }
            }]
          }]
        });
        
        registeredCommands.add(commandPath);
        commandMetadata.set(commandPath, {
          command: commandName,
          registered: new Date().toISOString()
        });
        
        app.debug(`Registered new command and created path: ${commandPath}`);
        updateConfig();
        return true;
      }
      return false;
    };

    // Helper function to update the plugin configuration
    const updateConfig = () => {
      const commands = Array.from(registeredCommands).map(path => {
        const metadata = commandMetadata.get(path);
        return {
          command: metadata.command,
          path: path,
          registered: metadata.registered
        };
      });
      
      app.savePluginOptions({ registeredCommands: commands }, () => {
        app.debug('Updated plugin configuration');
      });
    };

    // Create a generic handler for command paths
    const commandHandler = (context, path, value, callback) => {
      app.debug(`Handling PUT for ${path} with value:`, value);
      
      // Emit the command as a delta message
      app.handleMessage(null, {
        context: context,
        updates: [{
          source: {
            label: "zennora-signalk-register-commands"
          },
          timestamp: new Date().toISOString(),
          values: [{
            path: path,
            value: value
          }]
        }]
      });

      // Return success
      return { 
        state: 'COMPLETED', 
        statusCode: 200 
      };
    };

    // API endpoint to register new command paths
    app.post('/plugin-api/register-command', (req, res) => {
      try {
        const { command } = req.body;
        
        if (!command) {
          return res.status(400).json({ error: 'Command name required' });
        }

        const commandPath = `commands.${command}`;
        
        if (registeredCommands.has(commandPath)) {
          return res.json({ 
            success: true, 
            message: `Command ${command} already registered`,
            path: commandPath 
          });
        }

        // Use helper function to register and update config
        if (registerNewCommand(command)) {
          res.json({ 
            success: true, 
            message: `Command ${command} registered successfully`,
            path: commandPath 
          });
        } else {
          res.status(500).json({ error: 'Failed to register command' });
        }

      } catch (error) {
        app.debug('Error registering command:', error);
        res.status(500).json({ error: 'Failed to register command' });
      }
    });

    // API endpoint to list registered commands
    app.get('/plugin-api/commands', (req, res) => {
      res.json({ 
        commands: Array.from(registeredCommands),
        count: registeredCommands.size 
      });
    });

    // API endpoint to remove a command
    app.delete('/plugin-api/commands/:command', (req, res) => {
      try {
        const { command } = req.params;
        const commandPath = `commands.${command}`;
        
        if (!registeredCommands.has(commandPath)) {
          return res.status(404).json({ 
            error: `Command ${command} not found`,
            path: commandPath 
          });
        }

        // Remove from tracking sets and update config
        registeredCommands.delete(commandPath);
        commandMetadata.delete(commandPath);
        updateConfig();
        
        app.debug(`Removed command: ${commandPath}`);

        res.json({ 
          success: true, 
          message: `Command ${command} removed successfully`,
          path: commandPath 
        });

      } catch (error) {
        app.debug('Error removing command:', error);
        res.status(500).json({ error: 'Failed to remove command' });
      }
    });

    // Handle removed commands (compare config with current state)
    const configCommands = new Set();
    if (options && options.registeredCommands) {
      options.registeredCommands.forEach(cmd => {
        if (cmd.command) {
          configCommands.add(`commands.${cmd.command}`);
        }
      });
    }

    // Remove commands that are no longer in config
    registeredCommands.forEach(commandPath => {
      if (!configCommands.has(commandPath)) {
        registeredCommands.delete(commandPath);
        commandMetadata.delete(commandPath);
        app.debug(`Removed command from config: ${commandPath}`);
      }
    });

    // Load existing commands from config
    if (options && options.registeredCommands) {
      options.registeredCommands.forEach(cmd => {
        if (cmd.command) {
          const commandPath = `commands.${cmd.command}`;
          
          if (!registeredCommands.has(commandPath)) {
            registeredCommands.add(commandPath);
            commandMetadata.set(commandPath, {
              command: cmd.command,
              registered: cmd.registered || new Date().toISOString()
            });
            
            // Register the PUT handler
            app.registerPutHandler('vessels.self', commandPath, commandHandler, 'zennora-commands');
            
            // Create the initial data path with a default value
            app.handleMessage(null, {
              context: 'vessels.self',
              updates: [{
                source: {
                  label: "zennora-signalk-register-commands"
                },
                timestamp: new Date().toISOString(),
                values: [{
                  path: commandPath,
                  value: false
                }],
                meta: [{
                  path: commandPath,
                  value: {
                    units: 'bool',
                    description: `Command: ${cmd.command}`
                  }
                }]
              }]
            });
            
            // Force reset to false at startup
            setTimeout(() => {
              app.handleMessage(null, {
                context: 'vessels.self',
                updates: [{
                  source: {
                    label: "zennora-signalk-register-commands"
                  },
                  timestamp: new Date().toISOString(),
                  values: [{
                    path: commandPath,
                    value: false
                  }]
                }]
              });
              app.debug(`Reset command to false at startup: ${commandPath}`);
            }, 1000);
            
            app.debug(`Restored command from config: ${commandPath}`);
          }
        }
      });
    }

    // Handle new command from config
    if (options && options.newCommand && options.newCommand.trim()) {
      const commandName = options.newCommand.trim();
      app.debug(`Processing new command from config: ${commandName}`);
      
      if (registerNewCommand(commandName)) {
        app.debug(`Successfully registered command from config: ${commandName}`);
        
        // Update the config to clear newCommand and add to registeredCommands
        setTimeout(() => {
          const updatedOptions = { ...options };
          delete updatedOptions.newCommand;
          updatedOptions.registeredCommands = Array.from(registeredCommands).map(path => {
            const metadata = commandMetadata.get(path);
            return {
              command: metadata.command,
              path: path,
              registered: metadata.registered
            };
          });
          
          app.savePluginOptions(updatedOptions, (err) => {
            if (err) {
              app.debug('Error updating config:', err);
            } else {
              app.debug('Updated config after adding new command');
            }
          });
        }, 100);
      }
    }

    app.debug('Dynamic Command Registration plugin started');
  };

  plugin.stop = function() {
    app.debug('Stopping Dynamic Command Registration plugin');
    registeredCommands.clear();
  };

  plugin.schema = {
    type: 'object',
    properties: {
      registeredCommands: {
        type: 'array',
        title: 'Registered Commands',
        description: 'Commands currently registered for PUT operations',
        items: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              title: 'Command Name',
              description: 'Name of the command (without commands. prefix)'
            },
            path: {
              type: 'string',
              title: 'Full Path',
              description: 'Complete SignalK path',
              readOnly: true
            },
            registered: {
              type: 'string',
              title: 'Registered',
              description: 'When this command was registered',
              readOnly: true
            }
          }
        }
      },
      newCommand: {
        type: 'string',
        title: 'Add New Command',
        description: 'Enter command name and submit to add (e.g., captureWeather)',
        default: ''
      }
    }
  };

  plugin.uiSchema = {
    'ui:order': ['newCommand', 'registeredCommands'],
    registeredCommands: {
      'ui:options': {
        addable: false,
        removable: true,
        orderable: false
      },
      'ui:title': 'Currently Registered Commands',
      'ui:description': 'Remove commands by clicking the X button, then Submit. Server restart required to fully unregister PUT handlers.',
      items: {
        'ui:options': {
          removable: true
        },
        command: {
          'ui:readonly': true
        },
        path: {
          'ui:readonly': true,
          'ui:widget': 'textarea',
          'ui:options': {
            'rows': 1,
            'style': {
              'minWidth': '400px',
              'resize': 'none'
            }
          }
        },
        registered: {
          'ui:readonly': true
        }
      }
    },
    newCommand: {
      'ui:title': 'Add New Command',
      'ui:placeholder': 'e.g., captureWeather, captureMooring',
      'ui:help': 'Enter command name and Submit to register (will be available at vessels.self.commands.{commandName}).',
      'ui:options': {
        'ui:emptyValue': ''
      }
    }
  };

  return plugin;
};