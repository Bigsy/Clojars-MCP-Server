# Clojars MCP Server

A [Model Context Protocol (MCP)](https://github.com/ModelContext/protocol) server that provides tools for fetching dependency information from [Clojars](https://clojars.org/), the Clojure community's artifact repository.
<a href="https://glama.ai/mcp/servers/i37857er6w"><img width="380" height="200" src="https://glama.ai/mcp/servers/i37857er6w/badge" alt="Clojars-MCP-Server MCP server" /></a>

## Features

- Get the latest version of any Clojars dependency
- Check if a specific version of a dependency exists
- Simple, focused responses
- Easy integration with Claude through MCP

## How It Works

When this MCP server is configured in Claude's settings, it automatically becomes available in Claude's system prompt under the "Connected MCP Servers" section. This makes Claude aware of the server's capabilities and allows it to use the provided tools through the `use_mcp_tool` command.

The server exposes two tools:

### get_clojars_latest_version
```json
{
  "name": "get_clojars_latest_version",
  "description": "Get the latest version of a Clojars dependency (Maven artifact)",
  "inputSchema": {
    "type": "object",
    "properties": {
      "dependency": {
        "type": "string",
        "description": "Clojars dependency name in format \"group/artifact\" (e.g. \"metosin/reitit\")"
      }
    },
    "required": ["dependency"]
  }
}
```

### check_clojars_version_exists
```json
{
  "name": "check_clojars_version_exists",
  "description": "Check if a specific version of a Clojars dependency exists",
  "inputSchema": {
    "type": "object",
    "properties": {
      "dependency": {
        "type": "string",
        "description": "Clojars dependency name in format \"group/artifact\" (e.g. \"metosin/reitit\")"
      },
      "version": {
        "type": "string",
        "description": "Version to check (e.g. \"0.7.2\")"
      }
    },
    "required": ["dependency", "version"]
  }
}
```

The tool names and descriptions are specifically designed to help Claude understand that these tools are for retrieving version information from Clojars. When users ask about Clojars dependencies, Claude can recognize that these tools are appropriate for the task based on:
- The tool names explicitly indicate their purpose
- The descriptions specify they're for "Clojars dependency (Maven artifact)"
- The example formats show typical Clojars dependency patterns

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/clojars-deps-server.git
cd clojars-deps-server
```

2. Install dependencies:
```bash
npm install
```

3. Build the server:
```bash
npm run build
```

4. Add the server to your Claude configuration:

For VSCode Claude extension, add to `cline_mcp_settings.json` (typically located at `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/` on macOS):
```json
{
  "mcpServers": {
    "clojars-deps-server": {
      "command": "node",
      "args": ["/path/to/clojars-deps-server/build/index.js"]
    }
  }
}
```

For Claude desktop app, add to `claude_desktop_config.json` (typically located at `~/Library/Application Support/Claude/` on macOS):
```json
{
  "mcpServers": {
    "clojars-deps-server": {
      "command": "node",
      "args": ["/path/to/clojars-deps-server/build/index.js"]
    }
  }
}
```

After adding the server configuration, Claude will automatically detect and connect to the server on startup. The server's capabilities will be listed in Claude's system prompt under "Connected MCP Servers", making them available for use.

