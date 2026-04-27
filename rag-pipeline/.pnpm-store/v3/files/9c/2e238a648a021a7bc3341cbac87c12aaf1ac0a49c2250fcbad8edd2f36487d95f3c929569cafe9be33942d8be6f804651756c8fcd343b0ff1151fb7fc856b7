"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMultiModalOutput = handleMultiModalOutput;
exports._convertOpenAIResponsesUsageToLangChainUsage = _convertOpenAIResponsesUsageToLangChainUsage;
/**
 * Handle multi modal response content.
 *
 * @param content The content of the message.
 * @param messages The messages of the response.
 * @returns The new content of the message.
 */
function handleMultiModalOutput(content, messages) {
    /**
     * Handle OpenRouter image responses
     * @see https://openrouter.ai/docs/features/multimodal/image-generation#api-usage
     */
    if (messages &&
        typeof messages === "object" &&
        "images" in messages &&
        Array.isArray(messages.images)) {
        const images = messages.images
            .filter((image) => typeof image?.image_url?.url === "string")
            .map((image) => ({
            type: "image",
            url: image.image_url.url,
            source_type: "url",
        }));
        return [{ type: "text", text: content, source_type: "text" }, ...images];
    }
    return content;
}
function _convertOpenAIResponsesUsageToLangChainUsage(usage) {
    const inputTokenDetails = {
        ...(usage?.input_tokens_details?.cached_tokens != null && {
            cache_read: usage?.input_tokens_details?.cached_tokens,
        }),
    };
    const outputTokenDetails = {
        ...(usage?.output_tokens_details?.reasoning_tokens != null && {
            reasoning: usage?.output_tokens_details?.reasoning_tokens,
        }),
    };
    return {
        input_tokens: usage?.input_tokens ?? 0,
        output_tokens: usage?.output_tokens ?? 0,
        total_tokens: usage?.total_tokens ?? 0,
        input_token_details: inputTokenDetails,
        output_token_details: outputTokenDetails,
    };
}
