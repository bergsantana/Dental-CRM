import { OpenAI as OpenAIClient } from "openai";
import { StandardImageBlock, StandardTextBlock, UsageMetadata } from "@langchain/core/messages";
/**
 * Handle multi modal response content.
 *
 * @param content The content of the message.
 * @param messages The messages of the response.
 * @returns The new content of the message.
 */
export declare function handleMultiModalOutput(content: string, messages: unknown): (StandardImageBlock | StandardTextBlock)[] | string;
export declare function _convertOpenAIResponsesUsageToLangChainUsage(usage?: OpenAIClient.Responses.ResponseUsage): UsageMetadata;
