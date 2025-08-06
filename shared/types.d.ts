import type { UIMessage } from 'ai';

/**
 * Represents a UI message specific to the Allivo application.
 */
export type AllivoUIMessage = UIMessage<
  never, // metadata type
  {
    suggestion: {
      candidates: string[];
    };
  } // data parts type
>;
