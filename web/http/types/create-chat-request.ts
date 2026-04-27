import { RetrieveOptions } from "@/@types/retrieve-options";

export interface CreateChatRequest extends RetrieveOptions {
  rerank?: boolean;
}
