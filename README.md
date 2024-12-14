# Clojars MCP Server

A [Model Context Protocol (MCP)](https://github.com/ModelContext/protocol) server that provides tools for fetching dependency information from [Clojars](https://clojars.org/), the Clojure community's artifact repository.

## Features

- Fetch latest version information for any Clojars dependency
- Get full version history with download statistics
- Simple integration with Claude through MCP

## How It Works

When this MCP server is configured in Claude's settings, it automatically becomes available in Claude's system prompt under the "Connected MCP Servers" section. This makes Claude aware of the server's capabilities and allows it to use the provided tools through the `use_mcp_tool` command.

The server exposes a tool called `get_clojars_version` with the following schema:
```json
{
  "name": "get_clojars_version",
  "description": "Get version information for a Clojars dependency (Maven artifact)",
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

The tool name and description are specifically designed to help Claude understand that this tool is for retrieving version information from Clojars. When users ask about Clojars dependencies, Claude can recognize that this tool is appropriate for the task based on:
- The tool name `get_clojars_version` explicitly mentions Clojars
- The description specifies it's for "Clojars dependency (Maven artifact)"
- The example format shows a typical Clojars dependency pattern

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

## Example Usage

When you ask Claude about Clojars dependencies, it will recognize that this tool is appropriate based on its name and description. Here's an example:

```
Human: What's the latest version of metosin/reitit?
Assistant: Let me check the Clojars repository for that information.
[Uses get_clojars_version tool]
Response:
{
  "dependency": "metosin/reitit",
  "latest_version": "0.7.2",
  "recent_versions": [
    {
      "version": "0.7.2",
      "downloads": 132613
    },
    {
      "version": "0.7.1",
      "downloads": 43840
    },
    {
      "version": "0.7.0",
      "downloads": 31662
    }
    // ... more versions
  ]
}
```

The tool returns:
- The latest version of the dependency
- A complete version history with download statistics
- Proper error handling for cases like dependency not found

## Development

The server is built with TypeScript and uses:
- `@modelcontextprotocol/sdk` for MCP server implementation
- `axios` for making HTTP requests to the Clojars API

To make changes:
1. Edit the source code in `src/index.ts`
2. Run `npm run build` to compile
3. Restart Claude to pick up the changes

## Error Handling

The server handles various error cases:
- Invalid dependency format (must be "group/artifact")
- Dependency not found on Clojars
- API errors from Clojars

Error responses include descriptive messages to help troubleshoot issues.
