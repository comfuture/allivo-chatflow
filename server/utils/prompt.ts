import dedent from "dedent";
import { generateObject } from 'ai';
import { z } from 'zod';

export type PresentationPrepareContext = {
  step?: string; // 더 이상 고정된 step이 아님
  language?: string;
  subject?: string;
  audience?: string;
  core_message?: string;
  outline?: string;
  structure?: string;
}

// 질문 순서 정의
const FIELD_ORDER = ['subject', 'audience', 'core_message', 'structure'] as const;

// 다음에 물어볼 필드 찾기 (순서대로, 누락된 것 중에서)
function getNextMissingField(context: PresentationPrepareContext): string | null {
  for (const field of FIELD_ORDER) {
    if (!context[field]) {
      return field;
    }
  }
  return null;
}

// 컨텍스트에 따라 동적으로 프롬프트 생성
export const createPrompt = (context: PresentationPrepareContext, userMessage?: string) => {
  const nextField = getNextMissingField(context);
  
  // 모든 정보가 있으면 요약이나 수정 제안
  if (!nextField) {
    return dedent`The user has provided all necessary information for their presentation:
    - Subject: ${context.subject}
    - Audience: ${context.audience}
    - Core Message: ${context.core_message}
    - Structure: ${context.structure}
    
    Language: ${context.language || 'Detect from user message'}
    
    Provide a helpful summary and ask if they want to modify anything or if they're ready to start creating the presentation.
    Be conversational and supportive.
    IMPORTANT: Respond in the user's language.`;
  }
  
  // 사용자가 한 번에 여러 정보를 제공했을 수 있으므로, 다음에 물어볼 것만 묻기
  const contextInfo = dedent`Current context:
    ${context.subject ? `- Subject: ${context.subject}` : ''}
    ${context.audience ? `- Audience: ${context.audience}` : ''}
    ${context.core_message ? `- Core Message: ${context.core_message}` : ''}
    ${context.structure ? `- Structure: ${context.structure}` : ''}
    
    Language: ${context.language || 'Detect from user message'}
  `;
  
  return dedent`You are helping the user prepare a presentation. 
    ${contextInfo}
    
    Based on the predetermined order (subject → audience → core_message → structure), 
    ask about the next missing piece: ${nextField}
    
    Guidelines:
    - If subject is missing, ask about the presentation topic
    - If audience is missing, ask who they're presenting to
    - If core_message is missing, ask about the main point or key takeaway
    - If structure is missing, ask how they want to organize the content
    
    Be conversational and acknowledge what they've already shared.
    ${userMessage ? `User just said: "${userMessage}"` : ''}
    
    IMPORTANT: Detect the user's language from their message and respond in the same language.
    If the user writes in Korean, respond in Korean. If in English, respond in English.`;
}

export const createSuggestionsPrompt = (context: PresentationPrepareContext) => {
  const nextField = getNextMissingField(context);
  
  // 모든 정보가 수집되었을 때의 제안
  if (!nextField) {
    return dedent`The user has provided all necessary information for their presentation.
      Subject: ${context.subject}
      Audience: ${context.audience}
      Core Message: ${context.core_message}
      Structure: ${context.structure}
      
      Generate helpful action suggestions in the user's language (${context.language || 'detect from context'}).
      <example for English>
        ['Start creating slides', 'Review and refine the core message', 'Add supporting data and examples']
      </example>
      <example for Korean>
        ['슬라이드 작성 시작하기', '핵심 메시지 검토 및 다듬기', '근거 자료와 예시 추가하기']
      </example>`;
  }
  
  const basePrompt = dedent`Generate suggestions relevant to what we're asking about.
    Current context:
    ${context.subject ? `Subject: ${context.subject}` : ''}
    ${context.audience ? `Audience: ${context.audience}` : ''}
    ${context.core_message ? `Core Message: ${context.core_message}` : ''}
    ${context.structure ? `Structure: ${context.structure}` : ''}
    
    User's language: ${context.language || 'unknown'}
    IMPORTANT: Generate all suggestions in the user's language (${context.language || 'detect from context'}).
    If the user communicates in Korean, provide Korean suggestions.
    If the user communicates in English, provide English suggestions.`;
  
  switch (nextField) {
    case 'subject':
      return dedent`${basePrompt}
        Create suggestions for presentation subjects in the user's language.
        <example for English>
          ['AI in Healthcare', 'Climate Change Solutions', 'Remote Work Best Practices']
        </example>
        <example for Korean>
          ['헬스케어 분야의 AI', '기후 변화 해결방안', '원격 근무 모범 사례']
        </example>`;
    
    case 'audience':
      return dedent`${basePrompt}
        Create suggestions for potential audiences${context.subject ? ` for a presentation about ${context.subject}` : ''} in the user's language.
        <example for English>
          ['Company executives', 'University students', 'Industry professionals']
        </example>
        <example for Korean>
          ['회사 임원진', '대학생들', '업계 전문가들']
        </example>`;
    
    case 'core_message':
      return dedent`${basePrompt}
        Create suggestions for core messages${context.subject ? ` about ${context.subject}` : ''}${context.audience ? ` for ${context.audience}` : ''} in the user's language.
        <example for English>
          ['Innovation drives growth', 'Sustainability is profitable', 'Collaboration enhances productivity']
        </example>
        <example for Korean>
          ['혁신이 성장을 이끈다', '지속가능성은 수익성과 연결된다', '협업이 생산성을 향상시킨다']
        </example>`;
    
    case 'structure':
      return dedent`${basePrompt}
        Create suggestions for presentation structures in the user's language.
        <example for English>
          ['Problem → Solution → Benefits', 'Past → Present → Future', 'What → Why → How']
        </example>
        <example for Korean>
          ['문제 → 해결책 → 이점', '과거 → 현재 → 미래', '무엇을 → 왜 → 어떻게']
        </example>`;
    
    default:
      return undefined;
  }
}

// 사용자 메시지에서 컨텍스트 추출 (더 지능적으로)
export const processMessages = async (
  context: PresentationPrepareContext, 
  question: string, 
  answer: string
): Promise<Partial<PresentationPrepareContext>> => {
  const prompt = dedent`Extract ALL relevant information from the user's message.
  The user might provide multiple pieces of information at once.
  
  Current context:
  - Subject: ${context.subject || 'not defined yet'}
  - Audience: ${context.audience || 'not defined yet'}  
  - Core Message: ${context.core_message || 'not defined yet'}
  - Structure: ${context.structure || 'not defined yet'}
  - Current Language: ${context.language || 'not detected'}
  
  Assistant's last question: "${question}"
  User's answer: "${answer}"
  
  Extract any NEW information from the user's answer:
  - subject: What the presentation is about (e.g., "AI startup", "quarterly results", "new product")
  - audience: Who will be listening/watching (e.g., "investors", "team members", "customers")
  - core_message: The main point or key takeaway (e.g., "we need funding", "productivity increased")
  - structure: How the presentation will be organized (e.g., "problem-solution", "chronological")
  - language: Detect from user's answer - 'ko' if Korean, 'en' if English, 'ja' if Japanese, etc.
  
  Examples of extraction:
  - "투자자들에게 AI 스타트업을 소개해야 해" → subject: "AI 스타트업", audience: "투자자들", language: "ko"
  - "I need to convince the board about our expansion" → audience: "board", core_message: "expansion plan", language: "en"
  - "제품의 장점을 고객에게 설명하려고" → subject: "제품의 장점", audience: "고객", language: "ko"
  
  IMPORTANT: 
  - Be aggressive in extracting information even if indirect
  - Always detect the language from the user's current message
  - Return empty values for fields not found in the message`;
  
  const openai = useOpenAI();
  const { object: extracted } = await generateObject({
    model: openai('gpt-4o'),
    prompt,
    schema: z.object({
      language: z.string().max(10).optional()
        .describe('Language code detected from user message: ko for Korean, en for English, ja for Japanese, zh for Chinese, etc.'),
      subject: z.string().max(255).optional()
        .describe('The topic or subject of the presentation extracted from user message'),
      audience: z.string().max(255).optional()
        .describe('The target audience for the presentation (e.g., investors, customers, team)'), 
      core_message: z.string().max(2000).optional()
        .describe('The main point, key message, or objective of the presentation'),
      structure: z.string().max(255).optional()
        .describe('How the presentation will be organized (e.g., problem-solution, chronological, comparison)'),
    }),
  });
  
  // Debug log
  console.log('User message:', answer);
  console.log('Extracted:', extracted);
  
  // 새로운 정보만 반환 (이미 있는 정보는 덮어쓰지 않음)
  const updates: Partial<PresentationPrepareContext> = {};
  
  // 언어는 항상 업데이트 (사용자가 언어를 바꿀 수 있으므로)
  if (extracted.language) {
    updates.language = extracted.language;
  }
  
  if (extracted.subject && !context.subject) updates.subject = extracted.subject;
  if (extracted.audience && !context.audience) updates.audience = extracted.audience;
  if (extracted.core_message && !context.core_message) updates.core_message = extracted.core_message;
  if (extracted.structure && !context.structure) updates.structure = extracted.structure;
  
  // step은 다음에 물어볼 필드에 따라 결정
  const nextField = getNextMissingField({ ...context, ...updates });
  updates.step = nextField ? `collecting_${nextField}` : 'complete';
  
  return updates;
}