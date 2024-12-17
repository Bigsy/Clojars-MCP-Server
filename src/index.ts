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
}

const isValidDependencyArgs = (args: any): args is { dependency: string } =>
  typeof args === 'object' &&
  args !== null &&
  typeof args.dependency === 'string' &&
  args.dependency.includes('/');

const isValidVersionCheckArgs = (args: any): args is { dependency: string; version: string } =>
  typeof args === 'object' &&
  args !== null &&
  typeof args.dependency === 'string' &&
  args.dependency.includes('/') &&
  typeof args.version === 'string';

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
      baseURL: 'https://repo.clojars.org',
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
          name: 'get_clojars_latest_version',
          description: 'Get the latest version of a Clojars dependency (Maven artifact)',
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
        {
          name: 'check_clojars_version_exists',
          description: 'Check if a specific version of a Clojars dependency exists',
          inputSchema: {
            type: 'object',
            properties: {
              dependency: {
                type: 'string',
                description: 'Clojars dependency name in format "group/artifact" (e.g. "metosin/reitit")',
              },
              version: {
                type: 'string',
                description: 'Version to check (e.g. "0.7.2")',
              },
            },
            required: ['dependency', 'version'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === 'get_clojars_latest_version') {
        if (!isValidDependencyArgs(request.params.arguments)) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Invalid dependency format. Expected "group/artifact" (e.g. "metosin/reitit")'
          );
        }

        const [group, artifact] = request.params.arguments.dependency.split('/');

        try {
          const response = await this.axiosInstance.get<string>(
            `/${group.replace(/\./g, '/')}/${artifact}/maven-metadata.xml`
          );

          // Extract latest version from XML
          const versionMatch = response.data.match(/<latest>(.*?)<\/latest>/);
          const releaseMatch = response.data.match(/<release>(.*?)<\/release>/);
          const latestVersion = releaseMatch?.[1] || versionMatch?.[1];

          if (!latestVersion) {
            throw new Error('Could not find version information in metadata');
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    dependency: `${group}/${artifact}`,
                    latest_version: latestVersion
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
      } else if (request.params.name === 'check_clojars_version_exists') {
        if (!isValidVersionCheckArgs(request.params.arguments)) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Invalid arguments. Expected "dependency" in format "group/artifact" and "version"'
          );
        }

        const [group, artifact] = request.params.arguments.dependency.split('/');
        const version = request.params.arguments.version;

        try {
          const response = await this.axiosInstance.get<string>(
            `/${group.replace(/\./g, '/')}/${artifact}/maven-metadata.xml`
          );

          // Extract all versions from XML
          const versionsMatch = response.data.match(/<version>(.*?)<\/version>/g);
          const versions = versionsMatch?.map(v => v.replace(/<\/?version>/g, '')) || [];

          const exists = versions.includes(version);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    dependency: `${group}/${artifact}`,
                    version: version,
                    exists: exists
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
      } else {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
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
