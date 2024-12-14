#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

interface ClojarsResponse {
  group_name: string;
  jar_name: string;
  latest_release: string;
  latest_version: string;
  recent_versions: string[];
}

const isValidDependencyArgs = (args: any): args is { dependency: string } =>
  typeof args === 'object' &&
  args !== null &&
  typeof args.dependency === 'string' &&
  args.dependency.includes('/');

class ClojarsServer {
  private server: Server;
  private axiosInstance;

  constructor() {
    this.server = new Server(
      {
        name: 'clojars-deps-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.axiosInstance = axios.create({
      baseURL: 'https://clojars.org/api',
      headers: {
        'Accept': 'application/json',
      },
    });

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_clojars_version',
          description: 'Get version information for a Clojars dependency (Maven artifact)',
          inputSchema: {
            type: 'object',
            properties: {
              dependency: {
                type: 'string',
                description: 'Clojars dependency name in format "group/artifact" (e.g. "metosin/reitit")',
              },
            },
            required: ['dependency'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== 'get_clojars_version') {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }

      if (!isValidDependencyArgs(request.params.arguments)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Invalid dependency format. Expected "group/artifact" (e.g. "metosin/reitit")'
        );
      }

      const [group, artifact] = request.params.arguments.dependency.split('/');

      try {
        const response = await this.axiosInstance.get<ClojarsResponse>(
          `/artifacts/${group}/${artifact}`
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  dependency: `${group}/${artifact}`,
                  latest_version: response.data.latest_release || response.data.latest_version,
                  recent_versions: response.data.recent_versions || [],
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const message = error.response?.status === 404
            ? `Dependency ${group}/${artifact} not found on Clojars`
            : `Clojars API error: ${error.message}`;
          
          return {
            content: [
              {
                type: 'text',
                text: message,
              },
            ],
            isError: true,
          };
        }
        throw error;
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Clojars MCP server running on stdio');
  }
}

const server = new ClojarsServer();
server.run().catch(console.error);
