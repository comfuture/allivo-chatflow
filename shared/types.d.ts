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

/**
 * Context for preparing a presentation in Allivo
 */
export type PresentationPrepareContext = {
  step?: string;
  language?: string;
  subject?: string;
  audience?: string;
  core_message?: string;
  purpose?: string; // 발표의 목적 추가
  outline?: string;
  structure?: string;
}
