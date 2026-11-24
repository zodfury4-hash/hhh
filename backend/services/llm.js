const { TextDecoder } = require('util');
const config = require('../config');

class LlmUnavailableError extends Error {
  constructor(message, code = 'AI_PROVIDER_UNAVAILABLE') {
    super(message);
    this.name = 'LlmUnavailableError';
    this.code = code;
    this.status = 503;
  }
}

let mockProvider = null;

function setMockProvider(mockFn) {
  mockProvider = mockFn;
}

function resetMockProvider() {
  mockProvider = null;
}

function isMocked() {
  return typeof mockProvider === 'function';
}

function isAiConfigured() {
  return isMocked() || !!(config.ai.anthropicApiKey && config.ai.anthropicApiKey.trim());
}

/**
 * Execute an HTTP request to Anthropic Messages API with retry on 429/5xx
 */
async function callAnthropicMessagesApi(payload, { timeoutMs = 25000, maxRetries = 2 } = {}) {
  const apiKey = config.ai.anthropicApiKey;
  if (!apiKey) {
    throw new LlmUnavailableError('AI service is not configured (missing ANTHROPIC_API_KEY).', 'AI_NOT_CONFIGURED');
  }

  const url = 'https://api.anthropic.com/v1/messages';
  const headers = {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json'
  };

  let lastError = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const startTime = Date.now();
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (res.ok) {
        if (payload.stream) {
          return { res, latencyMs: Date.now() - startTime };
        }
        const data = await res.json();
        const latencyMs = Date.now() - startTime;
        return { data, latencyMs };
      }

      // Check retryable status codes: 429 (rate limit) or 5xx (server error)
      const errorText = await res.text();
      let errJson = null;
      try {
        errJson = JSON.parse(errorText);
      } catch (_e) {}

      const isRetryable = res.status === 429 || res.status >= 500;
      if (isRetryable && attempt < maxRetries) {
        const backoff = Math.pow(2, attempt) * 600 + Math.random() * 200;
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }

      throw new LlmUnavailableError(
        `Anthropic API returned status ${res.status}: ${errJson?.error?.message || errorText}`,
        res.status === 429 ? 'AI_RATE_LIMITED' : 'AI_PROVIDER_ERROR'
      );
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        lastError = new LlmUnavailableError(`AI request timed out after ${timeoutMs}ms`, 'AI_TIMEOUT');
      } else {
        lastError = err;
      }

      if (attempt < maxRetries) {
        const backoff = Math.pow(2, attempt) * 600;
        await new Promise((r) => setTimeout(r, backoff));
      }
    }
  }

  throw lastError || new LlmUnavailableError('AI request failed after retries', 'AI_PROVIDER_UNAVAILABLE');
}

/**
 * Complete non-streaming prompt
 */
async function complete({
  system = '',
  messages = [],
  model = config.ai.modelFast,
  max_tokens = 1024,
  temperature = 0.3,
  tools = null,
  timeoutMs = 15000
} = {}) {
  if (isMocked()) {
    const mockRes = await mockProvider({ system, messages, model, max_tokens, temperature, tools });
    if (typeof mockRes === 'string') {
      return { text: mockRes, toolCalls: [], usage: { inputTokens: 50, outputTokens: 50 }, latencyMs: 5 };
    }
    return {
      text: mockRes?.text || '',
      toolCalls: mockRes?.toolCalls || [],
      usage: mockRes?.usage || { inputTokens: 50, outputTokens: 50 },
      latencyMs: mockRes?.latencyMs || 5,
      ...mockRes
    };
  }

  const payload = {
    model,
    max_tokens,
    temperature,
    messages
  };
  if (system) payload.system = system;
  if (Array.isArray(tools) && tools.length > 0) payload.tools = tools;

  const { data, latencyMs } = await callAnthropicMessagesApi(payload, { timeoutMs });

  // Extract text and tool calls from Anthropic response format
  let text = '';
  const toolCalls = [];

  if (Array.isArray(data.content)) {
    for (const block of data.content) {
      if (block.type === 'text') {
        text += block.text;
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          name: block.name,
          input: block.input
        });
      }
    }
  }

  return {
    text,
    toolCalls,
    rawContent: data.content,
    stopReason: data.stop_reason,
    usage: {
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0
    },
    latencyMs
  };
}

/**
 * Streaming completion via Server-Sent Events
 */
async function stream({
  system = '',
  messages = [],
  model = config.ai.modelChat,
  max_tokens = 2048,
  temperature = 0.5,
  tools = null,
  onEvent = () => {},
  timeoutMs = 30000
} = {}) {
  if (isMocked()) {
    const mockRes = await mockProvider({ system, messages, model, max_tokens, temperature, tools, stream: true });
    if (typeof mockRes.streamGenerator === 'function') {
      for await (const chunk of mockRes.streamGenerator()) {
        onEvent(chunk);
      }
      return mockRes;
    }
    onEvent({ type: 'token', text: mockRes.text });
    onEvent({ type: 'done', usage: mockRes.usage || { inputTokens: 10, outputTokens: 20 } });
    return mockRes;
  }

  const payload = {
    model,
    max_tokens,
    temperature,
    stream: true,
    messages
  };
  if (system) payload.system = system;
  if (Array.isArray(tools) && tools.length > 0) payload.tools = tools;

  const { res, latencyMs } = await callAnthropicMessagesApi(payload, { timeoutMs });

  let fullText = '';
  let inputTokens = 0;
  let outputTokens = 0;
  let stopReason = null;

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep trailing incomplete line

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const dataStr = trimmed.slice(5).trim();
      if (!dataStr || dataStr === '[DONE]') continue;

      try {
        const parsed = JSON.parse(dataStr);
        if (parsed.type === 'message_start' && parsed.message?.usage) {
          inputTokens = parsed.message.usage.input_tokens || 0;
        } else if (parsed.type === 'content_block_delta') {
          if (parsed.delta?.type === 'text_delta') {
            const token = parsed.delta.text;
            fullText += token;
            onEvent({ type: 'token', text: token });
          }
        } else if (parsed.type === 'message_delta') {
          stopReason = parsed.delta?.stop_reason;
          if (parsed.usage?.output_tokens) {
            outputTokens = parsed.usage.output_tokens;
          }
        }
      } catch (_parseErr) {}
    }
  }

  onEvent({
    type: 'done',
    usage: { inputTokens, outputTokens },
    stopReason
  });

  return {
    text: fullText,
    usage: { inputTokens, outputTokens },
    stopReason,
    latencyMs
  };
}

/**
 * Server-side agentic tool loop (max 6 iterations)
 */
async function toolLoop({
  system = '',
  messages = [],
  model = config.ai.modelChat,
  max_tokens = 2048,
  temperature = 0.3,
  tools = [],
  toolHandlers = {},
  onEvent = () => {},
  maxIterations = 6
} = {}) {
  const currentMessages = [...messages];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const response = await complete({
      system,
      messages: currentMessages,
      model,
      max_tokens,
      temperature,
      tools
    });

    totalInputTokens += response.usage.inputTokens;
    totalOutputTokens += response.usage.outputTokens;

    // Check if the model called tools
    if (!response.toolCalls || response.toolCalls.length === 0) {
      // Final text response reached
      onEvent({ type: 'token', text: response.text });
      return {
        text: response.text,
        messages: currentMessages,
        usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens }
      };
    }

    // Add assistant's response to conversation history
    currentMessages.push({
      role: 'assistant',
      content: response.rawContent
    });

    // Execute each tool call
    const toolResults = [];
    for (const toolCall of response.toolCalls) {
      onEvent({ type: 'tool_start', tool: toolCall.name, input: toolCall.input });

      const handler = toolHandlers[toolCall.name];
      let result = null;
      let isError = false;

      if (typeof handler === 'function') {
        try {
          result = await handler(toolCall.input);
        } catch (handlerErr) {
          result = { error: handlerErr.message || 'Tool execution failed' };
          isError = true;
        }
      } else {
        result = { error: `Tool ${toolCall.name} not implemented` };
        isError = true;
      }

      onEvent({ type: 'tool_result', tool: toolCall.name, result, isError });

      // If the tool produced a pending write action, stop loop and return action proposal
      if (result && result.pendingAction) {
        return {
          text: response.text,
          pendingAction: result.pendingAction,
          messages: currentMessages,
          usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens }
        };
      }

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolCall.id,
        content: JSON.stringify(result)
      });
    }

    // Add tool results as a user turn
    currentMessages.push({
      role: 'user',
      content: toolResults
    });
  }

  return {
    text: 'Maximum tool interaction steps reached. Please try refining your request.',
    messages: currentMessages,
    usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens }
  };
}

module.exports = {
  LlmUnavailableError,
  isAiConfigured,
  setMockProvider,
  resetMockProvider,
  isMocked,
  complete,
  stream,
  toolLoop
};
