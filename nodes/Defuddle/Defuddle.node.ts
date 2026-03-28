import { JSDOM } from 'jsdom';
import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import {
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';
import Defuddle from 'defuddle/full';

const includeRepliesOptions: INodePropertyOptions[] = [
	{
		name: 'Auto (Extractor Defaults)',
		value: 'extractors',
		description: 'Use Defuddle extractor defaults for replies',
	},
	{
		name: 'Include All Replies',
		value: 'true',
		description: 'Include all replies, including comment sections',
	},
	{
		name: 'Exclude All Replies',
		value: 'false',
		description: 'Exclude all replies',
	},
];

const defuddleOptionsCollection: INodeProperties[] = [
	{
		displayName: 'Markdown',
		name: 'markdown',
		type: 'boolean',
		default: false,
		description: 'Whether to convert content to Markdown',
	},
	{
		displayName: 'Separate Markdown',
		name: 'separateMarkdown',
		type: 'boolean',
		default: false,
		description:
			'Whether to keep HTML in content and add Markdown as contentMarkdown',
	},
	{
		displayName: 'Debug',
		name: 'debug',
		type: 'boolean',
		default: false,
		description: 'Whether to include Defuddle debug information in the response',
	},
	{
		displayName: 'Language',
		name: 'language',
		type: 'string',
		default: '',
		placeholder: 'en',
		description:
			'Preferred language in BCP 47 format, for example en, fr, or ja',
	},
	{
		displayName: 'Content Selector',
		name: 'contentSelector',
		type: 'string',
		default: '',
		placeholder: 'main article',
		description:
			'CSS selector to use as the main content element instead of auto-detection',
	},
	{
		displayName: 'Include Replies',
		name: 'includeReplies',
		type: 'options',
		default: 'extractors',
		options: includeRepliesOptions,
		description: 'How replies should be handled',
	},
	{
		displayName: 'Remove Exact Selectors',
		name: 'removeExactSelectors',
		type: 'boolean',
		default: true,
		description:
			'Whether to remove elements matching exact selectors such as ads or social buttons',
	},
	{
		displayName: 'Remove Partial Selectors',
		name: 'removePartialSelectors',
		type: 'boolean',
		default: true,
		description:
			'Whether to remove elements matching partial selectors such as ads or social buttons',
	},
	{
		displayName: 'Remove Hidden Elements',
		name: 'removeHiddenElements',
		type: 'boolean',
		default: true,
		description:
			'Whether to remove elements hidden with CSS such as display none or visibility hidden',
	},
	{
		displayName: 'Remove Low Scoring',
		name: 'removeLowScoring',
		type: 'boolean',
		default: true,
		description:
			'Whether to remove non-content blocks identified by Defuddle scoring',
	},
	{
		displayName: 'Remove Small Images',
		name: 'removeSmallImages',
		type: 'boolean',
		default: true,
		description: 'Whether to remove small images such as icons or tracking pixels',
	},
	{
		displayName: 'Remove Images',
		name: 'removeImages',
		type: 'boolean',
		default: false,
		description: 'Whether to remove images from the extracted content',
	},
	{
		displayName: 'Standardize',
		name: 'standardize',
		type: 'boolean',
		default: true,
		description:
			'Whether to standardize HTML such as headings, code blocks, and footnotes',
	},
	{
		displayName: 'Remove Content Patterns',
		name: 'removeContentPatterns',
		type: 'boolean',
		default: true,
		description:
			'Whether to remove Defuddle content patterns such as read time or article cards',
	},
	{
		displayName: 'Use Async Extractors',
		name: 'useAsync',
		type: 'boolean',
		default: true,
		description:
			'Whether to allow async extractors to fetch from third-party sources when needed',
	},
];

type DefuddleNodeOptions = {
	debug?: boolean;
	markdown?: boolean;
	separateMarkdown?: boolean;
	removeExactSelectors?: boolean;
	removePartialSelectors?: boolean;
	removeImages?: boolean;
	useAsync?: boolean;
	removeHiddenElements?: boolean;
	removeLowScoring?: boolean;
	removeSmallImages?: boolean;
	standardize?: boolean;
	removeContentPatterns?: boolean;
	contentSelector?: string;
	language?: string;
	includeReplies?: boolean | 'extractors';
};

function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.trim().length > 0;
}

function normalizeIncludeReplies(
	value: string | undefined,
): DefuddleNodeOptions['includeReplies'] {
	if (value === 'true') {
		return true;
	}

	if (value === 'false') {
		return false;
	}

	return 'extractors';
}

function buildDefuddleOptions(options: IDataObject): DefuddleNodeOptions {
	const result: DefuddleNodeOptions = {};

	const booleanKeys: Array<keyof DefuddleNodeOptions> = [
		'debug',
		'markdown',
		'separateMarkdown',
		'removeExactSelectors',
		'removePartialSelectors',
		'removeImages',
		'useAsync',
		'removeHiddenElements',
		'removeLowScoring',
		'removeSmallImages',
		'standardize',
		'removeContentPatterns',
	];

	for (const key of booleanKeys) {
		if (typeof options[key] === 'boolean') {
			result[key] = options[key] as boolean;
		}
	}

	if (isNonEmptyString(options.language)) {
		result.language = options.language.trim();
	}

	if (isNonEmptyString(options.contentSelector)) {
		result.contentSelector = options.contentSelector.trim();
	}

	if (typeof options.includeReplies === 'string') {
		result.includeReplies = normalizeIncludeReplies(options.includeReplies);
	}

	return result;
}

function toErrorObject(error: unknown): JsonObject {
	if (error instanceof Error) {
		return {
			message: error.message,
			name: error.name,
			stack: error.stack,
		};
	}

	if (typeof error === 'string') {
		return {
			message: error,
		};
	}

	return {
		message: 'Unknown error',
	};
}

export class DefuddleNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Defuddle',
		name: 'defuddle',
		icon: 'file:defuddle.svg',
		group: ['transform'],
		version: 1,
		description: 'Extract main webpage content and metadata using Defuddle',
		defaults: {
			name: 'Defuddle',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'https://example.com/article',
				description: 'URL of the page to fetch and parse with Defuddle',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: defuddleOptionsCollection,
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const output: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const url = this.getNodeParameter('url', itemIndex) as string;
				const rawOptions = this.getNodeParameter(
					'options',
					itemIndex,
					{},
				) as IDataObject;

				if (!isNonEmptyString(url)) {
					throw new NodeOperationError(this.getNode(), 'URL is required', {
						itemIndex,
					});
				}

				let normalizedUrl: string;

				try {
					normalizedUrl = new URL(url.trim()).toString();
				} catch (error) {
					throw new NodeOperationError(this.getNode(), 'URL must be a valid absolute URL', {
						itemIndex,
						description:
							error instanceof Error ? error.message : undefined,
					});
				}

				const defuddleOptions = buildDefuddleOptions(rawOptions);
				const requestOptions: {
					url: string;
					method: 'GET';
					encoding: 'text';
					headers?: IDataObject;
				} = {
					url: normalizedUrl,
					method: 'GET',
					encoding: 'text',
				};

				if (defuddleOptions.language) {
					requestOptions.headers = {
						'Accept-Language': defuddleOptions.language,
					};
				}

				const html = (await this.helpers.httpRequest(requestOptions)) as string;
				const dom = new JSDOM(html, {
					url: normalizedUrl,
				});
				const parser = new Defuddle(dom.window.document, {
					...defuddleOptions,
					url: normalizedUrl,
				});
				const result = await parser.parseAsync();
				const jsonResult = JSON.parse(JSON.stringify(result)) as JsonObject;

				output.push({
					json: jsonResult,
					pairedItem: {
						item: itemIndex,
					},
				});
			} catch (error) {
				if (this.continueOnFail()) {
					output.push({
						json: {
							error: toErrorObject(error),
						},
						pairedItem: {
							item: itemIndex,
						},
					});
					continue;
				}

				if (error instanceof NodeOperationError) {
					throw error;
				}

				throw new NodeOperationError(this.getNode(), error as Error, {
					itemIndex,
				});
			}
		}

		return [output];
	}
}
