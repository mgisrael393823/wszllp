import Anthropic from '@anthropic-ai/sdk';

export class AnthropicProvider {
  private client: Anthropic;

  constructor(apiKey?: string) {
    // Use environment variable if no API key provided
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    
    if (!key) {
      throw new Error(
        'Anthropic API key not found. Please set ANTHROPIC_API_KEY environment variable or pass it to the constructor.'
      );
    }

    this.client = new Anthropic({
      apiKey: key,
    });
  }

  async complete(prompt: string, options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  }): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: options?.model || 'claude-3-haiku-20240307',
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature || 0.3,
        system: options?.systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Extract text from the response
      const content = response.content[0];
      if (content.type === 'text') {
        return content.text;
      }
      
      throw new Error('Unexpected response type from Anthropic API');
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw error;
    }
  }

  async analyze(code: string, task: string): Promise<any> {
    const prompt = `Analyze the following code and ${task}:

\`\`\`
${code}
\`\`\`

Provide a detailed analysis in JSON format.`;

    const response = await this.complete(prompt, {
      systemPrompt: 'You are a code analysis expert. Always respond with valid JSON.',
    });

    try {
      return JSON.parse(response);
    } catch {
      // If JSON parsing fails, return the raw response
      return { analysis: response };
    }
  }

  async generateCode(specification: string, context?: string): Promise<string> {
    const prompt = `Generate code based on the following specification:

${specification}

${context ? `Context:\n${context}` : ''}

Provide only the code without explanations.`;

    return await this.complete(prompt, {
      systemPrompt: 'You are an expert programmer. Generate clean, well-commented code.',
      temperature: 0.2,
    });
  }

  async refactorCode(code: string, instructions: string): Promise<string> {
    const prompt = `Refactor the following code according to these instructions:

Instructions: ${instructions}

Code:
\`\`\`
${code}
\`\`\`

Provide the refactored code without explanations.`;

    return await this.complete(prompt, {
      systemPrompt: 'You are a code refactoring expert. Maintain functionality while improving code quality.',
      temperature: 0.1,
    });
  }
}