export interface ToolDefinition {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, unknown>
    required: string[]
  }
  requiresApproval: boolean
  execute: (input: Record<string, unknown>, context: ToolContext) => Promise<string>
}

export interface ToolContext {
  workspaceDir: string
  env: NodeJS.ProcessEnv
  taskId: string
}

const registry = new Map<string, ToolDefinition>()

export function registerTool(tool: ToolDefinition): void {
  registry.set(tool.name, tool)
}

export function getTool(name: string): ToolDefinition | undefined {
  return registry.get(name)
}

export function getAllTools(): ToolDefinition[] {
  return Array.from(registry.values())
}
