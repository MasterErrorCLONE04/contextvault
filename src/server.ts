#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { CONFIG } from "./config.js";
import { toolDefinitions } from "./tools/definitions.js";
import { toolHandlers } from "./tools/handlers.js";

export class ContextVaultServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: CONFIG.serverName,
        version: CONFIG.version
      },
      { capabilities: { tools: {} } }
    );
    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: toolDefinitions
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const handler = (toolHandlers as any)[name];

      if (!handler) {
        return {
          content: [{ type: "text", text: `Error: Tool '${name}' no encontrada` }],
          isError: true
        };
      }

      try {
        // Ahora los handlers pueden ser async
        return await handler(args);
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error ejecutando ${name}: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`✅ ContextVault v${CONFIG.version} con Semantic Search ejecutándose...`);
  }
}

// Solo ejecutar si es el entry point principal (ESM workaround simple)
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = new ContextVaultServer();
  server.run().catch(console.error);
}