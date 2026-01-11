import { tool } from '@langchain/core/tools';
import { z } from 'zod';

import type { BuilderTool, BuilderToolBase } from '@/utils/stream-processor';

import { ToolExecutionError, ValidationError } from '../errors';
import { createProgressReporter } from './helpers/progress';
import { createErrorResponse, createSuccessResponse } from './helpers/response';

/**
 * Known models and patterns for major LLM providers.
 * This list should be updated when providers release new models.
 *
 * Last updated: 2025-01
 */
const KNOWN_MODELS: Record<string, { models: string[]; patterns: RegExp[] }> = {
	openai: {
		models: [
			'gpt-5',
			'gpt-5.1',
			'gpt-5.2',
			'gpt-5-mini',
			'gpt-4.5',
			'gpt-4.5-preview',
			'gpt-4.1',
			'gpt-4.1-mini',
			'gpt-4.1-nano',
			'gpt-4o',
			'gpt-4o-mini',
			'gpt-4o-audio-preview',
			'gpt-4',
			'gpt-4-turbo',
			'gpt-4-turbo-preview',
			'gpt-3.5-turbo',
			'o1',
			'o1-mini',
			'o1-preview',
			'o1-pro',
			'o3',
			'o3-mini',
			'o3-pro',
			'o3-deep-research',
			'o4-mini',
			'o4-mini-deep-research',
		],
		patterns: [
			/^gpt-5(\.\d+)?(-mini)?(-\d{4}-\d{2}-\d{2})?$/,
			/^gpt-4\.5(-preview)?(-\d{4}-\d{2}-\d{2})?$/,
			/^gpt-4\.1(-mini|-nano)?(-\d{4}-\d{2}-\d{2})?$/,
			/^gpt-4o(-mini|-audio-preview)?(-\d{4}-\d{2}-\d{2})?$/,
			/^gpt-4(-turbo)?(-preview)?(-\d{4}-\d{2}-\d{2})?$/,
			/^gpt-3\.5-turbo(-\d{4}-\d{2}-\d{2})?$/,
			/^o[1-9](-mini|-preview|-pro|-deep-research)?(-\d{4}-\d{2}-\d{2})?$/,
		],
	},
	anthropic: {
		models: [
			'claude-opus-4',
			'claude-sonnet-4',
			'claude-sonnet-4-5',
			'claude-haiku-4',
			'claude-3.5-sonnet',
			'claude-3.5-haiku',
			'claude-3-5-sonnet',
			'claude-3-5-haiku',
			'claude-3-opus',
			'claude-3-sonnet',
			'claude-3-haiku',
		],
		patterns: [
			/^claude-(opus|sonnet|haiku)-[34](-5)?(-\d{8})?$/,
			/^claude-3\.?5?-(opus|sonnet|haiku)(-\d{8})?$/,
			/^claude-3-(opus|sonnet|haiku)(-\d{8})?$/,
		],
	},
	google: {
		models: [
			'gemini-2.0-pro',
			'gemini-2.0-flash',
			'gemini-2.0-flash-lite',
			'gemini-1.5-pro',
			'gemini-1.5-flash',
			'gemini-pro',
			'gemini-pro-vision',
		],
		patterns: [/^gemini-\d+\.\d+-(pro|flash|flash-lite)(-\d{3,4})?$/, /^gemini-pro(-vision)?$/],
	},
	meta: {
		models: ['llama-4', 'llama-3.3', 'llama-3.2', 'llama-3.1', 'llama-3'],
		patterns: [/^llama-[34](\.\d+)?(-\d+b)?(-instruct)?$/i],
	},
	mistral: {
		models: ['mistral-large', 'mistral-medium', 'mistral-small', 'mixtral-8x7b', 'mixtral-8x22b'],
		patterns: [/^mistral-(large|medium|small)(-\d+)?$/, /^mixtral-\d+x\d+b(-instruct)?$/i],
	},
};

type ValidationStatus = 'valid' | 'likely_valid' | 'unknown' | 'likely_invalid';

interface ModelValidationResult {
	model: string;
	provider: string;
	status: ValidationStatus;
	message: string;
	suggestions?: string[];
}

function detectProvider(model: string): string {
	const lowerModel = model.toLowerCase();

	if (lowerModel.startsWith('gpt-') || lowerModel.match(/^o[1-9]/)) return 'openai';
	if (lowerModel.startsWith('claude')) return 'anthropic';
	if (lowerModel.startsWith('gemini')) return 'google';
	if (lowerModel.startsWith('llama')) return 'meta';
	if (lowerModel.startsWith('mistral') || lowerModel.startsWith('mixtral')) return 'mistral';

	return 'unknown';
}

function findSimilarModels(model: string, provider: string): string[] {
	const providerData = KNOWN_MODELS[provider];
	if (!providerData) return [];

	const lowerModel = model.toLowerCase();

	return providerData.models
		.filter((knownModel) => {
			const lowerKnown = knownModel.toLowerCase();
			const modelBase = lowerModel.split('-').slice(0, 2).join('-');
			const knownBase = lowerKnown.split('-').slice(0, 2).join('-');
			return modelBase === knownBase || lowerKnown.includes(modelBase);
		})
		.slice(0, 3);
}

function validateModel(model: string, providerHint?: string): ModelValidationResult {
	const provider = providerHint ?? detectProvider(model);
	const providerData = KNOWN_MODELS[provider];

	// If provider is unknown, we can't validate
	if (!providerData) {
		return {
			model,
			provider: 'unknown',
			status: 'unknown',
			message: `Unknown provider for model '${model}'. Cannot validate - the model may or may not exist.`,
		};
	}

	const lowerModel = model.toLowerCase();
	const exactMatch = providerData.models.some((m) => m.toLowerCase() === lowerModel);

	if (exactMatch) {
		return {
			model,
			provider,
			status: 'valid',
			message: `'${model}' is a known ${provider} model.`,
		};
	}

	const patternMatch = providerData.patterns.some((pattern) => pattern.test(model));

	if (patternMatch) {
		return {
			model,
			provider,
			status: 'likely_valid',
			message: `'${model}' matches known ${provider} model patterns. It is likely valid.`,
		};
	}

	const suggestions = findSimilarModels(model, provider);

	return {
		model,
		provider,
		status: 'likely_invalid',
		message: `'${model}' is not a recognized ${provider} model. It may not exist or may be a typo.`,
		suggestions: suggestions.length > 0 ? suggestions : undefined,
	};
}

const validateModelNameSchema = z.object({
	model: z
		.string()
		.describe('The model name to validate (e.g., "gpt-4.1-mini", "claude-sonnet-4")'),
	provider: z
		.enum(['openai', 'anthropic', 'google', 'meta', 'mistral'])
		.optional()
		.describe('Optional provider hint. If not provided, will be auto-detected from model name.'),
});

export const VALIDATE_MODEL_NAME_TOOL: BuilderToolBase = {
	toolName: 'validate_model_name',
	displayTitle: 'Validating model name',
};

/**
 * Tool to validate LLM model names.
 *
 * Checks if a model name is valid for major providers (OpenAI, Anthropic, Google, etc.)
 * without requiring API credentials. Uses a maintained list of known models and patterns.
 */
export function createValidateModelNameTool(): BuilderTool {
	const dynamicTool = tool(
		async (input, config) => {
			const reporter = createProgressReporter(
				config,
				VALIDATE_MODEL_NAME_TOOL.toolName,
				VALIDATE_MODEL_NAME_TOOL.displayTitle,
			);

			try {
				const validatedInput = validateModelNameSchema.parse(input);
				reporter.start(validatedInput);

				const result = validateModel(validatedInput.model, validatedInput.provider);

				const output = {
					...result,
					note:
						result.status === 'likely_invalid'
							? 'This validation uses a known models list. If you believe this model exists, you can proceed - the actual node will validate at execution time.'
							: undefined,
				};

				reporter.complete(output);

				// Build response message
				let message = result.message;
				if (result.suggestions && result.suggestions.length > 0) {
					message += ` Did you mean: ${result.suggestions.join(', ')}?`;
				}

				return createSuccessResponse(config, message);
			} catch (error) {
				if (error instanceof z.ZodError) {
					const validationError = new ValidationError('Invalid input parameters', {
						extra: { errors: error.errors },
					});
					reporter.error(validationError);
					return createErrorResponse(config, validationError);
				}

				const toolError = new ToolExecutionError(
					error instanceof Error ? error.message : 'Failed to validate model name',
					{
						toolName: VALIDATE_MODEL_NAME_TOOL.toolName,
						cause: error instanceof Error ? error : undefined,
					},
				);

				reporter.error(toolError);
				return createErrorResponse(config, toolError);
			}
		},
		{
			name: VALIDATE_MODEL_NAME_TOOL.toolName,
			description:
				'Validate an LLM model name (e.g., "gpt-4.1-mini", "claude-sonnet-4") to check if it exists. ' +
				'Use this before configuring Chat Model nodes with user-specified models to catch typos or invalid model names. ' +
				'Returns whether the model is valid, likely valid (matches patterns), unknown, or likely invalid with suggestions.',
			schema: validateModelNameSchema,
		},
	);

	return {
		tool: dynamicTool,
		...VALIDATE_MODEL_NAME_TOOL,
	};
}
