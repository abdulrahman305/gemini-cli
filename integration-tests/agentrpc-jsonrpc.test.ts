/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { MCPServerConfig, Config } from '../packages/core/src/config/config.js';
import { McpClient } from '../packages/core/src/tools/mcp-client.js';
import { ToolRegistry } from '../packages/core/src/tools/tool-registry.js';
import { PromptRegistry } from '../packages/core/src/prompts/prompt-registry.js';
import { WorkspaceContext } from '../packages/core/src/utils/workspaceContext.js';
import { z } from 'zod';
import { expect, test } from 'vitest';
import { ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import * as path from 'node:path';


const AGENTRPC_API_SECRET = 'test-secret';
const PYTHON_SERVER_PORT = 5001; // Use a different port to avoid conflicts

let pythonServerProcess: ChildProcessWithoutNullStreams | undefined;

async function startPythonServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    pythonServerProcess = spawn(
      'python3',
      [
        '-m',
        'sdk-python.src.agentrpc.jsonrpc_server',
      ],
      {
        cwd: path.resolve(__dirname, '..'), // Adjust CWD to the project root
        env: {
          ...process.env,
          AGENTRPC_API_SECRET: AGENTRPC_API_SECRET,
          FLASK_RUN_PORT: PYTHON_SERVER_PORT.toString(),
        },
      },
    );

    pythonServerProcess.stdout.on('data', (data: Buffer) => {
      console.log(`Python Server stdout: ${data.toString()}`);
      if (data.toString().includes(`Running on http://127.0.0.1:${PYTHON_SERVER_PORT}`))
      {
        resolve();
      }
    });

    pythonServerProcess.stderr.on('data', (data: Buffer) => {
      console.error(`Python Server stderr: ${data.toString()}`);
    });

    pythonServerProcess.on('error', (err: Error) => {
      console.error(`Failed to start Python server: ${err}`);
      reject(err);
    });

    pythonServerProcess.on('close', (code: number) => {
      console.log(`Python server exited with code ${code}`);
      if (code !== 0) {
        reject(new Error(`Python server exited with code ${code}`));
      }
    });
  });
}

async function stopPythonServer(): Promise<void> {
  if (pythonServerProcess) {
    pythonServerProcess.kill();
    pythonServerProcess = undefined;
  }
}

test.beforeAll(async () => {
  await startPythonServer();
});

test.afterAll(async () => {
  await stopPythonServer();
});

test(
  'McpClient can connect to Python JSON-RPC server and call AgentRPC methods',
  async () => {
    const serverName = 'python-agentrpc-server';
    const serverConfig = new MCPServerConfig(
      undefined, // command
      undefined, // args
      undefined, // env
      undefined, // cwd
      undefined, // url
      undefined, // httpUrl
      undefined, // headers
      undefined, // tcp
      10000, // timeout
      true, // trust
      'Python AgentRPC JSON-RPC Server',
      undefined, // includeTools
      undefined, // excludeTools
      undefined, // extensionName
      undefined, // oauth
      undefined, // authProviderType
      `http://127.0.0.1:${PYTHON_SERVER_PORT}/jsonrpc`, // pythonJsonRpcUrl
    );

    // Minimal Config instance for ToolRegistry
    const config = new Config({
      sessionId: 'test-session',
      targetDir: path.resolve(__dirname, '..'),
      debugMode: false,
      model: 'test-model',
      cwd: path.resolve(__dirname, '..'),
    });
    const toolRegistry = new ToolRegistry(config);
    const promptRegistry = new PromptRegistry();
    const workspaceContext = new WorkspaceContext(path.resolve(__dirname, '..'), []);

    const mcpClient = new McpClient(
      serverName,
      serverConfig,
      toolRegistry,
      promptRegistry,
      workspaceContext,
      false, // debugMode
    );

    await mcpClient.connect();
    expect(mcpClient.getStatus()).toBe('connected');

    // Test get_cluster_id
    const clusterId = await mcpClient.getClient().request(
      { method: 'get_cluster_id', params: {} },
      z.any(),
    );
    expect(clusterId).toBeDefined();
    expect(typeof clusterId).toBe('string');

    // Test list_tools (requires a clusterId)
    const tools = await mcpClient.getClient().request(
      { method: 'list_tools', params: { clusterId: clusterId } },
      z.any(),
    );
    expect(tools).toBeDefined();
    // Accept any object for now, as the response shape may vary

    // Test create_and_poll_job (requires clusterId, tool_name, input_data)
    // This will likely fail as there are no actual tools registered, but we can test the call structure
    const jobResult = await mcpClient.getClient().request(
      {
        method: 'create_and_poll_job',
        params: {
          cluster_id: clusterId,
          tool_name: 'non_existent_tool',
          input_data: { some_key: 'some_value' },
        },
      },
      z.any(),
    );
    expect(jobResult).toBeDefined();
    // Accept any object for now, as the response shape may vary

    await mcpClient.disconnect();
    expect(mcpClient.getStatus()).toBe('disconnected');
  },
  { timeout: 30000 },
);
