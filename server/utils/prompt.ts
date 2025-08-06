import dedent from "dedent";
import { generateObject } from 'ai';
import { z } from 'zod';

type PresentationPrepareStep =
  | 'welcome'
  | 'subject'
  | 'audience'
  | 'core_message'
  | 'structure';

export type PresentationPrepareContext = {
  step: PresentationPrepareStep;
  language?: string; // prefer language to be a string like 'en', 'fr', etc.
  subject?: string; // the subject of the presentation
  audience?: string; // the audience for the presentation e.g., 'colleagues', 'students'
  core_message?: string; // the core message of the presentation in a descriptive way
  outline?: string; // the outline of the presentation, if available
  structure?: string; // the structure of the presentation
}

export const createPrompt = (context: PresentationPrepareContext, prompt?: string | undefined) => {
  switch (context.step) {
    case 'welcome': case undefined:
      return dedent`Create a warm and engaging welcome message for who are preparing a presentation.
      The message should be inviting and set a positive tone for the session.
      <example>
      Hello! What are you preparing a presentation about? Let's get started!
      </example>`;
    case 'subject':
      return dedent`Create a message to help the user define the subject of their presentation.
      The prompt should be open-ended and encourage the user to think about their topic.
      <example>
      Great! You are preparing a presentation on ${context.subject || 'a topic'}.
      Now, let's talk about your audience.
      Who are you preparing this presentation for?
      </example>
      <example>
      Interesting topic! then let's think about your audience.
      </example>
      <example>
      Awesome! You are preparing a presentation on ${context.subject || 'a topic'}.
      Who is your target audience?
      </example>
      `;
    case 'audience':
      return dedent`Create a message to help the user define their audience.
      The message should encourage the user to think about who will be receiving their presentation.
      <example>
      Awesome! You are preparing a presentation for ${context.audience || 'an audience'}.
      Who are you preparing this presentation for?
      </example>`;
    case 'coreMessage':
      return dedent`Create a message to help the user define the core message of their presentation.
      The message should encourage the user to think about the main point they want to convey.
      <example>
      Oh, You have defined your audience as ${context.audience || 'an audience'}.
      So, what is the core message you want to convey in your presentation?
      </example>
      <example>
      Oh, you have to present to your investors. That seems important!
      We need to define the core message of your presentation.
      What is the main point you want to convey?
      </example>`;
    case 'structure':
      return dedent`Create a message to help the user define the structure of their presentation.
      The message should encourage the user to think about how they want to organize their content.
      <example>
      Almost there! You have defined your core message as ${context.core_message || 'a core message'}.
      Now, let's think about the structure of your presentation.
      How do you want to organize your content?
      </example>`;
    default:
      return `Respond with the user's answer in a friendly and engaging way.
      <answer>
        ${prompt || 'What is your answer?'}
      </answer>
      `
  }
}

export const createSuggestionsPrompt = (context: PresentationPrepareContext) => {
  const INSTRUCTIONS = dedent`Respond with a list of suggestions based on the user's context.
  Each suggestion should be relevant to the current step of the presentation preparation.
  And the suggestions should be in a conversational tone.
  The list should be relevant to the context of preparing a presentation.
  <context>
    Subject: ${context.subject || 'a topic'}
    Audience: ${context.audience || 'not defined yet'}
    Core Message: ${context.core_message || 'not defined yet'}
    Structure: ${context.structure || 'not defined yet'}
  </context>`;


  switch (context.step) {
    case 'subject':
      return dedent`${INSTRUCTIONS}\nCreate a list of sample subjects for a presentation.
      The subjects should be diverse and cover various topics.
      <example>
        ['The Future of AI in Education',
        'Sustainable Practices in Modern Architecture',
        'The Impact of Social Media on Mental Health']
      </example>
      `
    case 'audience':
      return dedent`${INSTRUCTIONS}\nCreate a list of potential audiences for a presentation.
      The audiences should be diverse and cover various demographics.
      <example>
        ['College Students',
        'Corporate Executives',
        'High School Teachers']
      </example>
      `
    case 'core_message':
      return dedent`${INSTRUCTIONS}\nCreate a list of potential core messages for a presentation.
      The core messages should be concise and impactful.
      <example>
        ['The importance of lifelong learning',
        'The role of technology in modern education',
        'The benefits of sustainable living']
      </example>
      `
    case 'structure':
      return dedent`${INSTRUCTIONS}\nCreate a list of potential structures for a presentation.
      The structures should be logical and easy to follow.
      <example>
        ['Introduction, Body, Conclusion',
        'Problem, Solution, Benefits',
        'Past, Present, Future']
      </example>
      `
    default:
      return undefined;
  }
}

const getNextStep = (currentStep: PresentationPrepareStep): PresentationPrepareStep => {
  const steps = [
    'welcome',
    'subject',
    'audience',
    'coreMessage',
    'structure']
  const currentIndex = steps.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex === steps.length - 1) {
    return 'welcome'; // or throw an error if you want to handle it differently
  }
  return steps[currentIndex + 1] as PresentationPrepareStep;
}

export const processMessages = async (context: PresentationPrepareContext, question: string, answer: string): Promise<Partial<PresentationPrepareContext>> => {
  const prompt = dedent`Extract the relevant context from the user's answer to given question.
  The context should include the current step, language, subject, audience, core message, and structure.
  Try to extract current context's step from the question and answer, then extract as much context as possible.
  If the answer does not provide enough information or is not relevant to the question,
  return an empty object.
  <question>
    ${question}
  </question>
  <answer>
    ${answer}
  </answer>
  <context>
    Subject: ${context.subject || 'not defined yet'}
    Audience: ${context.audience || 'not defined yet'}
    Core Message: ${context.core_message || 'not defined yet'}
    Structure: ${context.structure || 'not defined yet'}
  </context>
  `;
  const openai = useOpenAI();
  const { object: extracted } = await generateObject({
    model: openai('gpt-4.1'),
    prompt,
    schema: z.object({
      language: z.string().max(100).optional(),
      subject: z.string().max(255).optional(),
      audience: z.string().max(255).optional(),
      core_message: z.string().max(2000).optional(),
      structure: z.string().max(255).optional(),
    }),
  });
  return {
    ...extracted,
    step: getNextStep(context.step),
  };
}