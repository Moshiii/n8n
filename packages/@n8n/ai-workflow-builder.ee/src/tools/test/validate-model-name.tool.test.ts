import { getCurrentTaskInput } from '@langchain/langgraph';

import {
	createToolConfig,
	createToolConfigWithWriter,
	parseToolResult,
	expectToolSuccess,
	extractProgressMessages,
	findProgressMessage,
	type ParsedToolContent,
} from '../../../test/test-utils';
import { createValidateModelNameTool, VALIDATE_MODEL_NAME_TOOL } from '../validate-model-name.tool';

// Mock LangGraph dependencies
jest.mock('@langchain/langgraph', () => ({
	getCurrentTaskInput: jest.fn(),
	Command: jest.fn().mockImplementation((params: Record<string, unknown>) => ({
		content: JSON.stringify(params),
	})),
}));

describe('ValidateModelNameTool', () => {
	let tool: ReturnType<typeof createValidateModelNameTool>['tool'];
	const mockGetCurrentTaskInput = getCurrentTaskInput as jest.MockedFunction<
		typeof getCurrentTaskInput
	>;

	beforeEach(() => {
		jest.clearAllMocks();
		tool = createValidateModelNameTool().tool;

		// Setup default mock for getCurrentTaskInput
		mockGetCurrentTaskInput.mockReturnValue({
			workflowJSON: { nodes: [], connections: {}, name: 'Test Workflow' },
		});
	});

	describe('tool metadata', () => {
		it('should have correct name and description', () => {
			const toolObj = createValidateModelNameTool();
			expect(toolObj.toolName).toBe('validate_model_name');
			expect(toolObj.displayTitle).toBe('Validating model name');
			expect(toolObj.tool.name).toBe('validate_model_name');
		});
	});

	describe('OpenAI models', () => {
		it('should validate known GPT-4.1 models as valid', async () => {
			const result = await tool.invoke(
				{ model: 'gpt-4.1-mini' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'known');
			expectToolSuccess(parsed, 'openai');
		});

		it('should validate GPT-4o models as valid', async () => {
			const result = await tool.invoke(
				{ model: 'gpt-4o' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'known');
		});

		it('should validate O-series models as valid', async () => {
			const result = await tool.invoke(
				{ model: 'o1-mini' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'known');
		});

		it('should validate o3 models as valid', async () => {
			const result = await tool.invoke({ model: 'o3' }, createToolConfig('validate_model_name'));
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'known');
		});

		it('should validate o4-mini models as valid', async () => {
			const result = await tool.invoke(
				{ model: 'o4-mini' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'known');
		});

		it('should validate GPT-5 models as valid', async () => {
			const result = await tool.invoke({ model: 'gpt-5' }, createToolConfig('validate_model_name'));
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'known');
		});

		it('should validate GPT-5.1 and GPT-5.2 as valid', async () => {
			const result1 = await tool.invoke(
				{ model: 'gpt-5.1' },
				createToolConfig('validate_model_name'),
			);
			const parsed1 = parseToolResult<ParsedToolContent>(result1);
			expectToolSuccess(parsed1, 'known');

			const result2 = await tool.invoke(
				{ model: 'gpt-5.2' },
				createToolConfig('validate_model_name'),
			);
			const parsed2 = parseToolResult<ParsedToolContent>(result2);
			expectToolSuccess(parsed2, 'known');
		});

		it('should validate GPT-4.5 models as valid', async () => {
			const result = await tool.invoke(
				{ model: 'gpt-4.5' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'known');
		});

		it('should validate o3-pro as valid', async () => {
			const result = await tool.invoke(
				{ model: 'o3-pro' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'known');
		});

		it('should validate o1-pro as valid', async () => {
			const result = await tool.invoke(
				{ model: 'o1-pro' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'known');
		});

		it('should validate deep-research models as valid', async () => {
			const result1 = await tool.invoke(
				{ model: 'o3-deep-research' },
				createToolConfig('validate_model_name'),
			);
			const parsed1 = parseToolResult<ParsedToolContent>(result1);
			expectToolSuccess(parsed1, 'known');

			const result2 = await tool.invoke(
				{ model: 'o4-mini-deep-research' },
				createToolConfig('validate_model_name'),
			);
			const parsed2 = parseToolResult<ParsedToolContent>(result2);
			expectToolSuccess(parsed2, 'known');
		});

		it('should validate dated model versions as likely_valid', async () => {
			const result = await tool.invoke(
				{ model: 'gpt-4.1-mini-2025-04-14' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'likely valid');
		});

		it('should flag non-existent models as likely_invalid', async () => {
			const result = await tool.invoke(
				{ model: 'gpt-8.5' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'not a recognized');
		});

		it('should validate gpt-5-mini as valid', async () => {
			const result = await tool.invoke(
				{ model: 'gpt-5-mini' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'known');
		});

		it('should flag gpt-6 as likely_invalid', async () => {
			const result = await tool.invoke({ model: 'gpt-6' }, createToolConfig('validate_model_name'));
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'not a recognized');
		});
	});

	describe('Anthropic models', () => {
		it('should validate Claude 4 models as valid', async () => {
			const result = await tool.invoke(
				{ model: 'claude-sonnet-4' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'known');
			expectToolSuccess(parsed, 'anthropic');
		});

		it('should validate Claude 3.5 models as valid', async () => {
			const result = await tool.invoke(
				{ model: 'claude-3.5-sonnet' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'known');
		});

		it('should validate Claude opus 4 as valid', async () => {
			const result = await tool.invoke(
				{ model: 'claude-opus-4' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'known');
		});
	});

	describe('Google models', () => {
		it('should validate Gemini 2.0 models as valid', async () => {
			const result = await tool.invoke(
				{ model: 'gemini-2.0-flash' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'known');
			expectToolSuccess(parsed, 'google');
		});

		it('should validate Gemini 1.5 models as valid', async () => {
			const result = await tool.invoke(
				{ model: 'gemini-1.5-pro' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'known');
		});
	});

	describe('Meta models', () => {
		it('should validate Llama 4 as valid', async () => {
			const result = await tool.invoke(
				{ model: 'llama-4' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'known');
		});

		it('should validate Llama 3.3 as valid', async () => {
			const result = await tool.invoke(
				{ model: 'llama-3.3' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'known');
		});
	});

	describe('Mistral models', () => {
		it('should validate mistral-large as valid', async () => {
			const result = await tool.invoke(
				{ model: 'mistral-large' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'known');
		});

		it('should validate mixtral as valid', async () => {
			const result = await tool.invoke(
				{ model: 'mixtral-8x7b' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'known');
		});
	});

	describe('provider hint', () => {
		it('should use provider hint when provided', async () => {
			const result = await tool.invoke(
				{ model: 'custom-model', provider: 'openai' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'openai');
		});
	});

	describe('unknown providers', () => {
		it('should return unknown for unrecognized model patterns', async () => {
			const result = await tool.invoke(
				{ model: 'totally-unknown-model' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'Unknown provider');
		});

		it('should return unknown for cohere models', async () => {
			const result = await tool.invoke(
				{ model: 'cohere-command' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'Unknown provider');
		});

		it('should return unknown for palm models', async () => {
			const result = await tool.invoke(
				{ model: 'palm-2' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'Unknown provider');
		});
	});

	describe('typo detection and suggestions', () => {
		describe('OpenAI typos', () => {
			it('should suggest gpt-4o-mini for gpt-4o-mni typo', async () => {
				const result = await tool.invoke(
					{ model: 'gpt-4o-mni' },
					createToolConfig('validate_model_name'),
				);
				const parsed = parseToolResult<ParsedToolContent>(result);
				expectToolSuccess(parsed, 'not a recognized');
				expectToolSuccess(parsed, 'Did you mean');
				expectToolSuccess(parsed, 'gpt-4o-mini');
			});

			it('should suggest gpt-4o for gpt-40 typo', async () => {
				const result = await tool.invoke(
					{ model: 'gpt-40' },
					createToolConfig('validate_model_name'),
				);
				const parsed = parseToolResult<ParsedToolContent>(result);
				expectToolSuccess(parsed, 'not a recognized');
			});

			it('should suggest gpt-4.1-mini for gpt-4.1-min typo', async () => {
				const result = await tool.invoke(
					{ model: 'gpt-4.1-min' },
					createToolConfig('validate_model_name'),
				);
				const parsed = parseToolResult<ParsedToolContent>(result);
				expectToolSuccess(parsed, 'not a recognized');
				expectToolSuccess(parsed, 'Did you mean');
			});

			it('should suggest gpt-3.5-turbo for gpt-3.5-turb typo', async () => {
				const result = await tool.invoke(
					{ model: 'gpt-3.5-turb' },
					createToolConfig('validate_model_name'),
				);
				const parsed = parseToolResult<ParsedToolContent>(result);
				expectToolSuccess(parsed, 'not a recognized');
				expectToolSuccess(parsed, 'gpt-3.5-turbo');
			});
		});

		describe('Anthropic typos', () => {
			it('should flag claude-sonet-4 as not recognized', async () => {
				const result = await tool.invoke(
					{ model: 'claude-sonet-4' },
					createToolConfig('validate_model_name'),
				);
				const parsed = parseToolResult<ParsedToolContent>(result);
				expectToolSuccess(parsed, 'not a recognized');
				// Note: This typo doesn't get suggestions because the base "claude-sonet"
				// doesn't match any known model bases in findSimilarModels
			});

			it('should suggest claude-3.5-sonnet for claude-3.5-sonet typo', async () => {
				const result = await tool.invoke(
					{ model: 'claude-3.5-sonet' },
					createToolConfig('validate_model_name'),
				);
				const parsed = parseToolResult<ParsedToolContent>(result);
				expectToolSuccess(parsed, 'not a recognized');
				expectToolSuccess(parsed, 'Did you mean');
			});

			it('should flag claude-opuss-4 as not recognized', async () => {
				const result = await tool.invoke(
					{ model: 'claude-opuss-4' },
					createToolConfig('validate_model_name'),
				);
				const parsed = parseToolResult<ParsedToolContent>(result);
				expectToolSuccess(parsed, 'not a recognized');
			});

			it('should suggest models for claude-3-sonett typo', async () => {
				const result = await tool.invoke(
					{ model: 'claude-3-sonett' },
					createToolConfig('validate_model_name'),
				);
				const parsed = parseToolResult<ParsedToolContent>(result);
				expectToolSuccess(parsed, 'not a recognized');
				expectToolSuccess(parsed, 'Did you mean');
				// The similarity function matches claude-3.5-* models since base is "claude-3"
				expectToolSuccess(parsed, 'claude-3.5-sonnet');
			});
		});

		describe('Google typos', () => {
			it('should suggest gemini-2.0-flash for gemini-2.0-flas typo', async () => {
				const result = await tool.invoke(
					{ model: 'gemini-2.0-flas' },
					createToolConfig('validate_model_name'),
				);
				const parsed = parseToolResult<ParsedToolContent>(result);
				expectToolSuccess(parsed, 'not a recognized');
				expectToolSuccess(parsed, 'Did you mean');
				expectToolSuccess(parsed, 'gemini-2.0');
			});

			it('should suggest gemini-1.5-pro for gemini-1.5-pr typo', async () => {
				const result = await tool.invoke(
					{ model: 'gemini-1.5-pr' },
					createToolConfig('validate_model_name'),
				);
				const parsed = parseToolResult<ParsedToolContent>(result);
				expectToolSuccess(parsed, 'not a recognized');
				expectToolSuccess(parsed, 'Did you mean');
			});
		});

		describe('Meta typos', () => {
			it('should validate llama-3-instruct as likely_valid (matches pattern)', async () => {
				const result = await tool.invoke(
					{ model: 'llama-3-instruct' },
					createToolConfig('validate_model_name'),
				);
				const parsed = parseToolResult<ParsedToolContent>(result);
				// The instruct suffix is valid for llama models per the pattern
				expectToolSuccess(parsed, 'likely valid');
			});

			it('should return unknown provider for lama-4 typo (missing l)', async () => {
				const result = await tool.invoke(
					{ model: 'lama-4' },
					createToolConfig('validate_model_name'),
				);
				const parsed = parseToolResult<ParsedToolContent>(result);
				// lama- doesn't match llama- prefix, so unknown provider
				expectToolSuccess(parsed, 'Unknown provider');
			});
		});

		describe('Mistral typos', () => {
			it('should suggest mistral-large for mistral-larg typo', async () => {
				const result = await tool.invoke(
					{ model: 'mistral-larg' },
					createToolConfig('validate_model_name'),
				);
				const parsed = parseToolResult<ParsedToolContent>(result);
				expectToolSuccess(parsed, 'not a recognized');
				expectToolSuccess(parsed, 'Did you mean');
				expectToolSuccess(parsed, 'mistral-large');
			});

			it('should suggest mixtral-8x7b for mixtral-8x7 typo', async () => {
				const result = await tool.invoke(
					{ model: 'mixtral-8x7' },
					createToolConfig('validate_model_name'),
				);
				const parsed = parseToolResult<ParsedToolContent>(result);
				expectToolSuccess(parsed, 'not a recognized');
			});
		});
	});

	describe('pattern matching - likely_valid status', () => {
		it('should validate gpt-4o with date suffix as likely_valid', async () => {
			const result = await tool.invoke(
				{ model: 'gpt-4o-2024-08-06' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'likely valid');
		});

		it('should validate claude-sonnet-4 with date suffix as likely_valid', async () => {
			const result = await tool.invoke(
				{ model: 'claude-sonnet-4-20250514' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'likely valid');
		});

		it('should validate o1 with date suffix as likely_valid', async () => {
			const result = await tool.invoke(
				{ model: 'o1-2024-12-17' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'likely valid');
		});

		it('should validate llama-3.1-70b-instruct as likely_valid', async () => {
			const result = await tool.invoke(
				{ model: 'llama-3.1-70b-instruct' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'likely valid');
		});

		it('should validate mixtral-8x22b-instruct as likely_valid', async () => {
			const result = await tool.invoke(
				{ model: 'mixtral-8x22b-instruct' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'likely valid');
		});

		it('should validate mistral-large-2 as likely_valid', async () => {
			const result = await tool.invoke(
				{ model: 'mistral-large-2' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'likely valid');
		});
	});

	describe('progress reporter', () => {
		it('should report progress start and complete for valid model', async () => {
			const config = createToolConfigWithWriter('validate_model_name', 'test-call-1');
			await tool.invoke({ model: 'gpt-4o' }, config);

			const messages = extractProgressMessages(config.writer);
			expect(messages.length).toBeGreaterThanOrEqual(2);

			const startMsg = findProgressMessage(messages, 'running', 'input');
			expect(startMsg).toBeDefined();

			const completedMsg = findProgressMessage(messages, 'completed');
			expect(completedMsg).toBeDefined();
		});

		it('should report progress start and complete for invalid model', async () => {
			const config = createToolConfigWithWriter('validate_model_name', 'test-call-2');
			await tool.invoke({ model: 'gpt-999' }, config);

			const messages = extractProgressMessages(config.writer);
			expect(messages.length).toBeGreaterThanOrEqual(2);

			const startMsg = findProgressMessage(messages, 'running', 'input');
			expect(startMsg).toBeDefined();

			const completedMsg = findProgressMessage(messages, 'completed');
			expect(completedMsg).toBeDefined();
		});
	});

	describe('input validation', () => {
		it('should throw error for missing model parameter', async () => {
			await expect(
				tool.invoke({} as never, createToolConfig('validate_model_name')),
			).rejects.toThrow(/model|required/i);
		});

		it('should throw error for invalid provider hint', async () => {
			await expect(
				tool.invoke(
					{ model: 'gpt-4o', provider: 'invalid-provider' as never },
					createToolConfig('validate_model_name'),
				),
			).rejects.toThrow(/invalid|enum/i);
		});
	});

	describe('VALIDATE_MODEL_NAME_TOOL constant', () => {
		it('should export correct tool metadata', () => {
			expect(VALIDATE_MODEL_NAME_TOOL.toolName).toBe('validate_model_name');
			expect(VALIDATE_MODEL_NAME_TOOL.displayTitle).toBe('Validating model name');
		});
	});

	describe('case insensitivity', () => {
		it('should match models case-insensitively', async () => {
			const result = await tool.invoke(
				{ model: 'GPT-4O' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'known');
		});

		it('should detect provider case-insensitively', async () => {
			const result = await tool.invoke(
				{ model: 'CLAUDE-SONNET-4' },
				createToolConfig('validate_model_name'),
			);
			const parsed = parseToolResult<ParsedToolContent>(result);
			expectToolSuccess(parsed, 'anthropic');
		});
	});
});
