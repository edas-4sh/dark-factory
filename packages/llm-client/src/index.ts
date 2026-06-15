import { LLMConfig, LLMMessage, LLMFunction, LLMResponse } from '@dark-factory/shared';

export class LLMClient {
  private config: LLMConfig;

  constructor(config: Partial<LLMConfig> = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.OPENROUTER_API_KEY || '',
      baseUrl: config.baseUrl || process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      model: config.model || 'mistralai/mixtral-8x7b-instruct',
      maxTokens: config.maxTokens || 4096,
      temperature: config.temperature ?? 0.7,
    };
  }

  async chat(
    messages: LLMMessage[],
    functions?: LLMFunction[],
  ): Promise<LLMResponse> {
    const body: Record<string, unknown> = {
      model: this.config.model,
      messages: messages.map(m => {
        const msg: Record<string, unknown> = { role: m.role, content: m.content };
        if (m.tool_call_id) msg.tool_call_id = m.tool_call_id;
        return msg;
      }),
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
    };

    if (functions && functions.length > 0) {
      body.tools = functions.map(f => ({
        type: 'function',
        function: { name: f.name, description: f.description, parameters: f.parameters },
      }));
    }

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'HTTP-Referer': 'https://github.com/dark-factory',
        'X-Title': 'Dark Factory',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM API error ${response.status}: ${error}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content?: string; tool_calls?: Array<{ id: string; type: string; function: { name: string; arguments: string } }> } }> };
    const choice = data.choices[0];
    const message = choice.message;

    return {
      content: message.content || '',
      toolCalls: message.tool_calls?.map((tc: { id: string; type: string; function: { name: string; arguments: string } }) => ({
        id: tc.id,
        type: 'function' as const,
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      })),
    };
  }

  buildSystemPrompt(prompt: string): LLMMessage {
    return { role: 'system', content: prompt };
  }

  buildUserPrompt(content: string): LLMMessage {
    return { role: 'user', content };
  }

  buildToolResponse(toolCallId: string, content: string): LLMMessage {
    return { role: 'tool', content, tool_call_id: toolCallId };
  }
}
