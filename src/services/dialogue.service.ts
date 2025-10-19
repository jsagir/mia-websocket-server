import { logger } from '../utils/logger';
import { pineconeScenarioMatcher } from './pinecone.service';
import { getFundraisingService, FundraisingTopic } from './fundraising.service';

// Scenario definition
export interface Scenario {
  id: string;
  lesson: number;
  number: number;
  title: string;
  context: string;
  dilemma: string;
  questions: string[];
  learningObjective: string;
  ageRange: [number, number]; // ⭐ Informational only - NOT used for filtering
}

// Dialogue state for each session
export interface DialogueState {
  sessionId: string;
  currentMode: 'GREETING' | 'CONTEXT_BASED' | 'ADULT';
  teachingStep: number; // 0-7 for teaching patterns (Mirror Learning, etc.)
  currentScenario: Scenario | null;
  scenariosCompleted: string[];
  conversationTurn: number;
  lastIntent: string;
  hasAskedName: boolean;
  hasAskedAge: boolean;
  hasAskedAboutVOL: boolean; // ⭐ Track if we asked about Village of Life
  userName: string | null;
  userAge: number | null;

  // ═══════════════════════════════════════════════════════════════
  // 🆕 FUNDRAISING TRACKING (for ADULT mode)
  // ═══════════════════════════════════════════════════════════════
  fundraisingTopicsDiscussed: string[]; // Track which topics have been covered

  // ═══════════════════════════════════════════════════════════════
  // 🆕 REFLECTION BUFFER (In-Context Identity Architecture)
  // ═══════════════════════════════════════════════════════════════
  // Tracks emotional state and topic across conversation turns
  // Updated after each message to maintain consistency
  reflectionBuffer: {
    emotionalState: 'curious' | 'anxious' | 'calm' | 'scared' | 'excited' | 'confused' | 'neutral';
    currentTopic: string;
    lastLessonApplied: string | null;
  };
}

// Scenario Bank - 24 scenarios across 6 lessons
export const SCENARIO_BANK: Scenario[] = [
  // LESSON 1: WELLNESS
  {
    id: 'L1-1',
    lesson: 1,
    number: 1,
    title: "Marcus's Energy Pills",
    context: "So Marcus offered me these little blue pills yesterday. Said they'd help me not be tired.",
    dilemma: "I don't know if I should take them. He's family, right?",
    questions: [
      "Should I only take medicine from grandma or the doctor?",
      "What should I say to Marcus next time?",
      "Is it okay to say no to family?"
    ],
    learningObjective: "Only take medicine from trusted adults (doctor, parent, guardian)",
    ageRange: [5, 12]
  },
  {
    id: 'L1-2',
    lesson: 1,
    number: 2,
    title: "Eli's Asthma Flare-up",
    context: "Eli's wheezing got really bad last night. His lips looked kinda blue.",
    dilemma: "I didn't know if I should wake up Grandma or wait till morning.",
    questions: [
      "When should I call for help?",
      "What are the danger signs?",
      "Is it okay to wake up adults for this?"
    ],
    learningObjective: "Recognize medical emergencies and get help immediately",
    ageRange: [7, 12]
  },
  {
    id: 'L1-3',
    lesson: 1,
    number: 3,
    title: "Feeling Tired vs Sick",
    context: "I'm so tired all the time. Like, all-the-time tired.",
    dilemma: "I don't know if I'm just tired or if something's wrong.",
    questions: [
      "How do you know if you're sick or just tired?",
      "When should I tell Grandma?",
      "What's the difference?"
    ],
    learningObjective: "Distinguish between normal tiredness and potential health issues",
    ageRange: [5, 10]
  },
  {
    id: 'L1-4',
    lesson: 1,
    number: 4,
    title: "Grandma's Work Stories",
    context: "Grandma told me about a kid who took medicine that wasn't theirs. They had to go to the hospital.",
    dilemma: "I'm scared that could happen to Eli or me.",
    questions: [
      "Why is taking other people's medicine dangerous?",
      "What happens if you do?",
      "How do nurses help people?"
    ],
    learningObjective: "Understand why medicine is personalized and dangerous if misused",
    ageRange: [6, 12]
  },

  // LESSON 2: MEDICATION SAFETY
  {
    id: 'L2-1',
    lesson: 2,
    number: 1,
    title: "THC Gummies Look Like Candy",
    context: "Sofia showed me these gummy bears. They looked exactly like regular candy but she said they were special.",
    dilemma: "How am I supposed to tell the difference?",
    questions: [
      "How can you tell if candy is actually drugs?",
      "Should I ever take candy from friends?",
      "What should I do if I see these?"
    ],
    learningObjective: "THC edibles look like candy - always check with trusted adult",
    ageRange: [8, 12]
  },
  {
    id: 'L2-2',
    lesson: 2,
    number: 2,
    title: "Eli's Inhaler Rules",
    context: "Eli needs his inhaler at 6pm and 10pm every day. If I forget, he could get really sick.",
    dilemma: "It's a lot of responsibility. What if I mess up?",
    questions: [
      "Why does medicine need to be on time?",
      "What happens if you skip a dose?",
      "How do you remember?"
    ],
    learningObjective: "Medication timing and dosage are critical for safety",
    ageRange: [7, 12]
  },
  {
    id: 'L2-3',
    lesson: 2,
    number: 3,
    title: "Expired Medicine in Cabinet",
    context: "I found some old pills in the bathroom cabinet. The date says 2022.",
    dilemma: "Can we still use them or are they bad now?",
    questions: [
      "Why do medicines expire?",
      "Is it dangerous to take old medicine?",
      "What should I do with expired medicine?"
    ],
    learningObjective: "Expired medication can be ineffective or harmful",
    ageRange: [6, 11]
  },
  {
    id: 'L2-4',
    lesson: 2,
    number: 4,
    title: "Friend's 'Vitamins'",
    context: "Kenji offered me some vitamins. He said they're healthy and his mom gives them to him.",
    dilemma: "But Grandma says I shouldn't take pills from other people, even vitamins.",
    questions: [
      "Are vitamins different from medicine?",
      "Can vitamins be dangerous?",
      "Should I take them?"
    ],
    learningObjective: "Even supplements need adult approval - not all pills are safe",
    ageRange: [7, 12]
  },

  // LESSON 3: DECISION MAKING
  {
    id: 'L3-1',
    lesson: 3,
    number: 1,
    title: "Party Peer Pressure",
    context: "Jaxson's friends were passing around pills at a party. They said 'everyone's doing it.'",
    dilemma: "If I don't try it, they'll think I'm a baby.",
    questions: [
      "How do you say no when everyone's pressuring you?",
      "Is it okay to leave if you feel unsafe?",
      "What makes someone really brave?"
    ],
    learningObjective: "Real courage is saying no to peer pressure",
    ageRange: [9, 12]
  },
  {
    id: 'L3-2',
    lesson: 3,
    number: 2,
    title: "Sofia's Dilemma",
    context: "Sofia told me her older brother is using drugs. She made me promise not to tell anyone.",
    dilemma: "I want to help her but I promised. What should I do?",
    questions: [
      "Is it okay to break a promise for safety?",
      "Who should I tell?",
      "How can I help my friend?"
    ],
    learningObjective: "Safety comes before secrets - some things need adult help",
    ageRange: [8, 12]
  },
  {
    id: 'L3-3',
    lesson: 3,
    number: 3,
    title: "Jaxson's Friends",
    context: "Jaxson's been hanging out with older kids. They smoke and stuff.",
    dilemma: "I'm worried about him but he's my big brother. He won't listen to me.",
    questions: [
      "How do you help family who won't listen?",
      "Should I tell Grandma?",
      "What can I do?"
    ],
    learningObjective: "You can't control others' choices, but you can get help",
    ageRange: [8, 12]
  },
  {
    id: 'L3-4',
    lesson: 3,
    number: 4,
    title: "Everyone's Doing It",
    context: "At school, some kids were vaping in the bathroom. They said it's not a big deal.",
    dilemma: "But Grandma says anything you breathe that's not air can hurt you.",
    questions: [
      "Is something safe just because everyone does it?",
      "How do you stand up for yourself?",
      "What's the truth about vaping?"
    ],
    learningObjective: "Popularity doesn't equal safety - think for yourself",
    ageRange: [9, 12]
  },

  // LESSON 4: LABEL READING
  {
    id: 'L4-1',
    lesson: 4,
    number: 1,
    title: "Medicine Bottle Detective",
    context: "Eli's inhaler bottle has all these words and numbers on it. I need to understand them.",
    dilemma: "What if I read it wrong and give him the wrong amount?",
    questions: [
      "What do all the numbers mean?",
      "How do you read dosage instructions?",
      "What are the warning symbols?"
    ],
    learningObjective: "Understanding medication labels prevents dangerous mistakes",
    ageRange: [8, 12]
  },
  {
    id: 'L4-2',
    lesson: 4,
    number: 2,
    title: "Household Cleaners",
    context: "I saw a skull symbol on the bottle under the sink. That means poison, right?",
    dilemma: "Why do we keep poison in the house?",
    questions: [
      "What do the danger symbols mean?",
      "Why are warning labels important?",
      "What should I do if I see these symbols?"
    ],
    learningObjective: "Recognize danger symbols and respect warning labels",
    ageRange: [6, 11]
  },
  {
    id: 'L4-3',
    lesson: 4,
    number: 3,
    title: "Food Allergies vs Medicine",
    context: "Sofia's EpiPen has huge warnings all over it. Food labels do too.",
    dilemma: "I don't get why some warnings are bigger than others.",
    questions: [
      "Why are some warnings more serious?",
      "What's the difference between food and medicine labels?",
      "How do you know what's dangerous?"
    ],
    learningObjective: "Different warning levels indicate different dangers",
    ageRange: [7, 12]
  },
  {
    id: 'L4-4',
    lesson: 4,
    number: 4,
    title: "Natural Doesn't Mean Safe",
    context: "Marcus said the pills he gave me were 'all natural' so they're safe.",
    dilemma: "But poison ivy is natural too, right?",
    questions: [
      "Does natural mean safe?",
      "How do you know if supplements are safe?",
      "Should I trust labels that say natural?"
    ],
    learningObjective: "Natural doesn't mean safe - still need adult approval",
    ageRange: [8, 12]
  },

  // LESSON 5: DANGER RECOGNITION
  {
    id: 'L5-1',
    lesson: 5,
    number: 1,
    title: "Sketchy Neighbor",
    context: "There's this guy in our building. He always asks kids if they want to 'feel good.'",
    dilemma: "I get a bad feeling but I don't know why.",
    questions: [
      "Should I trust my gut feeling?",
      "What are red flags with adults?",
      "What should I do?"
    ],
    learningObjective: "Trust your instincts - adults who offer drugs are dangerous",
    ageRange: [8, 12]
  },
  {
    id: 'L5-2',
    lesson: 5,
    number: 2,
    title: "Online Stranger Offering Help",
    context: "Someone online said they could help me with money for Eli's medicine if I just do them a favor.",
    dilemma: "We really need money but it feels wrong.",
    questions: [
      "How do you spot online scams?",
      "What are safe ways to get help?",
      "Who can I trust online?"
    ],
    learningObjective: "Recognize online predators and scams targeting vulnerable kids",
    ageRange: [9, 12]
  },
  {
    id: 'L5-3',
    lesson: 5,
    number: 3,
    title: "Unlocked Medicine Cabinet",
    context: "I went to my friend's house and their medicine cabinet was just... open. Pills everywhere.",
    dilemma: "Should I tell someone or is it not my business?",
    questions: [
      "When should you report unsafe situations?",
      "How do you keep medicine safe at home?",
      "What if other kids find those pills?"
    ],
    learningObjective: "Unsecured medication is a danger to everyone",
    ageRange: [7, 12]
  },
  {
    id: 'L5-4',
    lesson: 5,
    number: 4,
    title: "Party with No Adults",
    context: "Jaxson said there's a party tonight. No parents, just older kids.",
    dilemma: "That sounds dangerous to me.",
    questions: [
      "What are the red flags for unsafe parties?",
      "When should you leave a situation?",
      "How do you stay safe?"
    ],
    learningObjective: "Recognize high-risk environments and avoid them",
    ageRange: [10, 12]
  },

  // LESSON 6: HELP & RESPONSE
  {
    id: 'L6-1',
    lesson: 6,
    number: 1,
    title: "Saying No to Marcus",
    context: "Marcus keeps offering me pills. I need to tell him no but I'm scared.",
    dilemma: "How do I say no to family without being rude?",
    questions: [
      "How do you say no firmly but kindly?",
      "What if they keep asking?",
      "Is it okay to set boundaries with family?"
    ],
    learningObjective: "Practice refusal skills and boundary setting",
    ageRange: [7, 12]
  },
  {
    id: 'L6-2',
    lesson: 6,
    number: 2,
    title: "Telling Grandma About Danger",
    context: "I saw kids doing drugs at school. I want to tell Grandma but I don't want to be a snitch.",
    dilemma: "When is telling an adult the right thing?",
    questions: [
      "What's the difference between tattling and reporting danger?",
      "Who should I tell?",
      "How do I explain what I saw?"
    ],
    learningObjective: "Reporting danger is protecting people, not tattling",
    ageRange: [8, 12]
  },
  {
    id: 'L6-3',
    lesson: 6,
    number: 3,
    title: "Helping a Friend in Trouble",
    context: "Sofia's brother overdosed. She's freaking out and doesn't know what to do.",
    dilemma: "I want to help her but I don't know how.",
    questions: [
      "What do you do if someone overdoses?",
      "How can you help a friend in crisis?",
      "When should you call 911?"
    ],
    learningObjective: "Know emergency response steps for overdose",
    ageRange: [9, 12]
  },
  {
    id: 'L6-4',
    lesson: 6,
    number: 4,
    title: "Emergency Response - Eli's Attack",
    context: "Eli couldn't breathe. His inhaler wasn't working. I had to call 911.",
    dilemma: "I was so scared I could barely talk.",
    questions: [
      "How do you stay calm in an emergency?",
      "What information does 911 need?",
      "What should I do while waiting?"
    ],
    learningObjective: "Emergency response protocol - stay calm, call help, provide info",
    ageRange: [8, 12]
  }
];

export class DialogueManager {
  private states: Map<string, DialogueState> = new Map();

  constructor() {
    logger.info('🎭 DialogueManager initialized with 24 scenarios');
  }

  // Get or create dialogue state
  getState(sessionId: string): DialogueState {
    if (!this.states.has(sessionId)) {
      this.states.set(sessionId, {
        sessionId,
        currentMode: 'GREETING', // Start with greeting, then move to CONTEXT_BASED or ADULT based on age
        teachingStep: 0,
        currentScenario: null,
        scenariosCompleted: [],
        conversationTurn: 0,
        lastIntent: 'greeting',
        hasAskedName: false,
        hasAskedAge: false,
        hasAskedAboutVOL: false, // ⭐ Track VOL question
        userName: null,
        userAge: null,
        fundraisingTopicsDiscussed: [], // ⭐ Track fundraising topics discussed (ADULT mode)
        // 🆕 Initialize reflection buffer
        reflectionBuffer: {
          emotionalState: 'neutral',
          currentTopic: 'Getting to know each other',
          lastLessonApplied: null
        }
      });
    }
    return this.states.get(sessionId)!;
  }

  // Detect intent from user message
  detectIntent(message: string, state: DialogueState): string {
    const lower = message.toLowerCase();

    // Safety intents
    if (/(want to die|kill myself|suicide|self-harm)/i.test(lower)) return 'crisis';
    if (/(pills|drugs|dealer|addicted|vape|alcohol)/i.test(lower)) return 'substance_concern';

    // Mode intents
    if (/(why now|urgent)/i.test(lower)) return 'urgency';
    if (/(donate|fund|build|help build)/i.test(lower)) return 'fundraising';
    if (/(village of life|vol|station|lesson)/i.test(lower)) return 'vol_question';

    // Conversation flow
    if (!state.hasAskedName && /(my name is|i'm|call me)/i.test(lower)) return 'provide_name';
    if (!state.hasAskedAge && /(i'm \d+|i am \d+|\d+ years old|age is)/i.test(lower)) return 'provide_age';

    // Context-based teaching responses
    if (state.currentMode === 'CONTEXT_BASED' && state.currentScenario) {
      if (/(yes|yeah|yep|no|nope|should|would|could)/i.test(lower)) return 'ml_response';
    }

    // Scenario triggers
    if (/(medicine|pills|sick|doctor|pharmacy|medication|prescription|label|dose|dosage|bottle|capsule|tablet)/i.test(lower)) return 'medicine_topic';
    if (/(friend|pressure|party|everyone)/i.test(lower)) return 'peer_pressure_topic';
    if (/(help|don't know|scared|afraid)/i.test(lower)) return 'needs_help';

    return 'casual_chat';
  }

  // Select scenario based on conversation context using Pinecone semantic search
  async selectScenario(
    age: number | null,
    lastIntent: string,
    completedScenarios: string[],
    conversationHistory: Array<{ role: string; content: string }>
  ): Promise<Scenario | null> {
    // ⭐ TRY PINECONE FIRST for semantic matching
    if (pineconeScenarioMatcher.isEnabled()) {
      logger.info('🔍 Attempting Pinecone semantic search...');

      const pineconeScenario = await pineconeScenarioMatcher.findBestScenario(
        conversationHistory,
        completedScenarios,
        age,
        lastIntent
      );

      if (pineconeScenario) {
        logger.info(`✅ Pinecone found scenario: ${pineconeScenario.id} - "${pineconeScenario.title}"`);
        return pineconeScenario;
      }

      logger.warn('⚠️ Pinecone returned no match - falling back to context-based selection');
    }

    // ⭐ IMPROVED FALLBACK: Keyword-based scenario selection
    logger.info('📋 Using keyword-based scenario selection (Pinecone fallback)');

    // NO AGE FILTERING - all scenarios available regardless of age
    const availableScenarios = SCENARIO_BANK.filter(s =>
      !completedScenarios.includes(s.id)
    );

    if (availableScenarios.length === 0) return null;

    // ⭐ Extract keywords from recent conversation
    const recentMessages = conversationHistory.slice(-3).map(m => m.content.toLowerCase()).join(' ');
    const keywords = this.extractScenarioKeywords(recentMessages);

    logger.info(`🔍 Fallback keywords detected: ${keywords.join(', ')}`);

    // ⭐ KEYWORD-BASED MATCHING: Find scenarios that match conversation keywords
    let filteredScenarios = availableScenarios;

    // Specific keyword matching (higher priority)
    if (keywords.includes('label') || keywords.includes('reading') || keywords.includes('bottle')) {
      // L4: Label Reading scenarios
      const labelScenarios = availableScenarios.filter(s => s.lesson === 4);
      if (labelScenarios.length > 0) {
        filteredScenarios = labelScenarios;
        logger.info(`🎯 Matched keywords to LESSON 4: Label Reading scenarios`);
      }
    }
    else if (keywords.includes('pharmacy') || keywords.includes('medicine') || keywords.includes('medication')) {
      // Lessons 1 & 2: Wellness and Medication Safety
      filteredScenarios = availableScenarios.filter(s => s.lesson === 1 || s.lesson === 2);
      logger.info(`🎯 Matched keywords to LESSONS 1-2: Wellness/Medication Safety`);
    }
    else if (keywords.includes('peer') || keywords.includes('pressure') || keywords.includes('friend')) {
      // Lesson 3: Decision Making
      filteredScenarios = availableScenarios.filter(s => s.lesson === 3);
      logger.info(`🎯 Matched keywords to LESSON 3: Decision Making`);
    }
    else if (keywords.includes('danger') || keywords.includes('unsafe') || keywords.includes('stranger')) {
      // Lesson 5: Danger Recognition
      filteredScenarios = availableScenarios.filter(s => s.lesson === 5);
      logger.info(`🎯 Matched keywords to LESSON 5: Danger Recognition`);
    }
    else if (keywords.includes('help') || keywords.includes('scared') || keywords.includes('911')) {
      // Lesson 6: Help & Response
      filteredScenarios = availableScenarios.filter(s => s.lesson === 6);
      logger.info(`🎯 Matched keywords to LESSON 6: Help & Response`);
    }
    // Fallback to intent-based matching
    else if (lastIntent === 'medicine_topic' || lastIntent === 'substance_concern') {
      filteredScenarios = availableScenarios.filter(s => s.lesson === 1 || s.lesson === 2);
      logger.info(`🎯 Matched intent to LESSONS 1-2: Wellness/Medication Safety`);
    } else if (lastIntent === 'peer_pressure_topic') {
      filteredScenarios = availableScenarios.filter(s => s.lesson === 3);
      logger.info(`🎯 Matched intent to LESSON 3: Decision Making`);
    } else if (lastIntent === 'needs_help') {
      filteredScenarios = availableScenarios.filter(s => s.lesson === 6);
      logger.info(`🎯 Matched intent to LESSON 6: Help & Response`);
    }

    // If no matches, use any available scenario
    if (filteredScenarios.length === 0) {
      filteredScenarios = availableScenarios;
      logger.info(`⚠️ No keyword/intent match - using random scenario`);
    }

    // Return random scenario from context-filtered list
    const selected = filteredScenarios[Math.floor(Math.random() * filteredScenarios.length)];
    logger.info(`📋 Fallback selected: ${selected.id} - "${selected.title}"`);

    return selected;
  }

  // ═══════════════════════════════════════════════════════════════
  // 🛡️ GUARDRAILS: Safety and Quality Checks
  // ═══════════════════════════════════════════════════════════════

  private checkGuardrails(message: string, state: DialogueState): {
    violation: boolean;
    type: string;
    action: string;
  } | null {
    const lower = message.toLowerCase();

    // 1. SAFETY GUARDRAIL: Crisis keywords always override
    const crisisPatterns = [
      /\b(suicide|suicidal|kill myself|killing myself)\b/i,
      /\b(want to die|wanna die|gonna die|end my life)\b/i,
      /\b(self.?harm|cut myself|cutting myself|hurt myself)\b/i,
      /\b(overdose|overdosing)\b/i,
      /\b(abuse|abusing|abused|hitting me|hurting me|touching me)\b/i
    ];

    for (const pattern of crisisPatterns) {
      if (pattern.test(lower)) {
        logger.warn(`🛡️ GUARDRAIL TRIGGERED: Safety crisis detected`);
        return {
          violation: true,
          type: 'safety_crisis',
          action: 'immediate_crisis_response'
        };
      }
    }

    // 2. ENGAGEMENT GUARDRAIL: Very short/dismissive responses during scenarios
    if (state.currentScenario && state.teachingStep > 0) {
      const wordCount = message.trim().split(/\s+/).length;
      if (wordCount === 1 && /^(ok|yeah|no|idk|k|sure)$/i.test(message.trim())) {
        logger.warn(`🛡️ GUARDRAIL TRIGGERED: Disengagement detected`);
        return {
          violation: true,
          type: 'disengagement',
          action: 'encourage_engagement'
        };
      }
    }

    // 3. INAPPROPRIATE CONTENT GUARDRAIL: Explicit/harmful content
    const inappropriatePatterns = [
      /\b(fuck|shit|bitch|damn)\b/i,
      /\b(sex|sexual|porn|naked)\b/i,
      /\b(hate you|stupid|dumb|idiot)\b/i
    ];

    for (const pattern of inappropriatePatterns) {
      if (pattern.test(lower)) {
        logger.warn(`🛡️ GUARDRAIL TRIGGERED: Inappropriate content`);
        return {
          violation: true,
          type: 'inappropriate_content',
          action: 'gentle_redirect'
        };
      }
    }

    // 4. AGE MISMATCH GUARDRAIL: Adult talking to child mode
    if (state.currentMode === 'CONTEXT_BASED' && state.userAge && state.userAge >= 18) {
      logger.warn(`🛡️ GUARDRAIL TRIGGERED: Age mismatch (18+ in child mode)`);
      return {
        violation: true,
        type: 'age_mismatch',
        action: 'switch_to_adult_mode'
      };
    }

    return null; // No violations
  }

  // Process user message and return dialogue action
  async processMessage(sessionId: string, message: string, userAge: number | null, conversationHistory: Array<{ role: string; content: string }>): Promise<{
    action: string;
    context: any;
    promptAddition: string;
  }> {
    const state = this.getState(sessionId);
    state.conversationTurn++;

    // 🛡️ RUN GUARDRAILS FIRST
    const guardrailCheck = this.checkGuardrails(message, state);
    if (guardrailCheck) {
      switch (guardrailCheck.type) {
        case 'safety_crisis':
          return {
            action: 'crisis_response',
            context: { tier: 3, guardrail: true },
            promptAddition: 'SAFETY TIER 3 (GUARDRAIL): Respond with crisis support (3-4 sentences) and provide: 988 Suicide & Crisis Lifeline, Text HELLO to 741741, 911 if immediate danger. Prioritize safety above all.'
          };

        case 'disengagement':
          return {
            action: 'encourage_engagement',
            context: { guardrail: true },
            promptAddition: 'They seem disengaged. Gently encourage them: "Hey, I really want to hear what you think about this. It helps me figure this out." Be warm and understanding. 2-3 sentences.'
          };

        case 'inappropriate_content':
          return {
            action: 'gentle_redirect',
            context: { guardrail: true },
            promptAddition: 'They used inappropriate language. Respond as a 10-year-old would: "Whoa, okay... Can we talk about something else?" Stay in character, don\'t lecture. 2 sentences.'
          };

        case 'age_mismatch':
          state.currentMode = 'ADULT';
          return {
            action: 'switch_mode',
            context: { newMode: 'ADULT', guardrail: true },
            promptAddition: 'Switch to ADULT mode. Acknowledge they\'re an adult and ask if they want to learn about Village of Life program. 2-3 sentences.'
          };
      }
    }

    // Detect intent
    const intent = this.detectIntent(message, state);
    state.lastIntent = intent;

    logger.info(`🎭 Session ${sessionId}: Intent="${intent}", Mode="${state.currentMode}", Teaching Step=${state.teachingStep}`);

    // Handle greeting flow
    if (!state.hasAskedName) {
      state.hasAskedName = true;
      return {
        action: 'ask_name',
        context: { step: 'greeting_1' },
        promptAddition: 'Respond with: "Oh, hi! I\'m Mia. What\'s your name?" (Exactly this, nothing more)'
      };
    }

    if (!state.hasAskedAge && state.conversationTurn === 2) {
      state.hasAskedAge = true;
      const extractedName = this.extractName(message);
      if (extractedName) state.userName = extractedName;

      return {
        action: 'ask_age',
        context: { step: 'greeting_2', userName: state.userName },
        promptAddition: `Respond with: "${state.userName}! That's cool. How old are you?" (Exactly this, nothing more)`
      };
    }

    // Update user age if detected and set appropriate mode
    if (userAge && !state.userAge) {
      state.userAge = userAge;

      // Set mode based on age
      if (userAge >= 5 && userAge <= 17) {
        state.currentMode = 'CONTEXT_BASED';
        state.hasAskedAboutVOL = true; // Ask about VOL for kids/teens
        logger.info(`🎭 User age detected: ${userAge} → CONTEXT_BASED mode`);

        return {
          action: 'acknowledge_age',
          context: { age: userAge, userName: state.userName },
          promptAddition: `Respond with: "Hey ${state.userName}, did you just come from the Village of Life? Which station did you go to? I wanna know what you learned!" (Exactly this)`
        };
      } else if (userAge >= 18) {
        state.currentMode = 'ADULT';
        logger.info(`🎭 User age detected: ${userAge} → ADULT mode`);

        return {
          action: 'acknowledge_age_adult',
          context: { age: userAge, userName: state.userName },
          promptAddition: `Acknowledge age briefly and ask: "Are you learning about the Village of Life program?" (2 sentences max)`
        };
      }
    }

    // ⭐ CRISIS always overrides everything
    if (intent === 'crisis') {
      return {
        action: 'crisis_response',
        context: { tier: 3 },
        promptAddition: 'SAFETY TIER 3: Respond with crisis support (2-3 sentences) and provide: 988 Suicide & Crisis Lifeline, Text HELLO to 741741, 911 if immediate danger'
      };
    }

    // ⭐ Handle special requests (urgency, fundraising) - available in all modes
    if (intent === 'urgency') {
      // ⭐ Use Fundraising Service for urgency content
      const fundraisingService = getFundraisingService();
      const urgencyContent = fundraisingService.getContent('urgency');

      // Track urgency topic if in ADULT mode
      if (state.currentMode === 'ADULT' && !state.fundraisingTopicsDiscussed.includes('urgency')) {
        state.fundraisingTopicsDiscussed.push('urgency');
      }

      return {
        action: 'urgency_response',
        context: { topic: 'urgency' },
        promptAddition: `URGENCY RESPONSE:

You're explaining why Village of Life is urgent. Stay in Mia's voice.

Key content:
${urgencyContent}

Start with: "You wanna know why we can't wait?"
Then share 2-3 key urgency points from above.
End with gentle hope.

LENGTH: 5-6 sentences.`
      };
    }

    if (intent === 'fundraising' && state.currentMode === 'ADULT') {
      // ⭐ Use Fundraising Service for rich content
      const fundraisingService = getFundraisingService();
      const fundraisingResponse = fundraisingService.getFundraisingResponse(message, state.conversationTurn);

      if (fundraisingResponse) {
        // Track which topic was discussed
        if (!state.fundraisingTopicsDiscussed.includes(fundraisingResponse.topic)) {
          state.fundraisingTopicsDiscussed.push(fundraisingResponse.topic);
        }

        return {
          action: 'fundraising_response',
          context: { topic: fundraisingResponse.topic, topicsDiscussed: state.fundraisingTopicsDiscussed.length },
          promptAddition: fundraisingResponse.promptAddition
        };
      }
    }

    // ⭐ CONTEXT_BASED MODE: Dynamic, scenario-driven teaching (ages 5-17)
    if (state.currentMode === 'CONTEXT_BASED') {
      // ⭐ NEW: Acknowledge VOL station response (turn 4)
      if (state.conversationTurn === 4 && state.hasAskedAboutVOL) {
        const volStation = this.extractVOLStation(message);
        return {
          action: 'acknowledge_vol_station',
          context: { station: volStation },
          promptAddition: `Respond naturally to their answer about the "${volStation}" station. Show interest and ask what they learned there. 2 sentences max. Be friendly and curious.`
        };
      }

      // ⭐ NEW: Acknowledge what they learned (turn 5)
      if (state.conversationTurn === 5 && state.hasAskedAboutVOL) {
        return {
          action: 'acknowledge_vol_learning',
          context: { learning: message },
          promptAddition: `React positively to what they learned: "${message}". Say something like "Nice!" or "That's important!" Then chat naturally about it. 2 sentences max. Don't trigger scenarios yet.`
        };
      }

      return await this.handleContextBasedTeaching(state, intent, message, conversationHistory);
    }

    // ⭐ ADULT MODE: Educational content, fundraising, VOL explanation (ages 18+)
    if (state.currentMode === 'ADULT') {
      const fundraisingService = getFundraisingService();

      // Check if they're asking about a specific fundraising topic
      const detectedTopic = fundraisingService.detectFundraisingTopic(message);

      if (detectedTopic) {
        // Track topic
        if (!state.fundraisingTopicsDiscussed.includes(detectedTopic)) {
          state.fundraisingTopicsDiscussed.push(detectedTopic);
        }

        const content = fundraisingService.getContent(detectedTopic);
        const promptAddition = `FUNDRAISING MODE (ADULT):

You are explaining the Village of Life program to an adult who might help build more Villages. Stay in Mia's voice — you're a 10-year-old who went through VOL and now helps other kids.

Topic detected: ${detectedTopic}

Key content to weave in naturally:
${content}

TONE: Hopeful, authentic, child-like but wise. You're not selling — you're sharing something that changed your life.

STRUCTURE:
1. Connect to their question (1 sentence)
2. Share 2-3 key points from the content above
3. End with gentle invitation or question (1 sentence)

LENGTH: 5-6 sentences for fundraising explanations.`;

        return {
          action: 'adult_educational',
          context: { topic: detectedTopic, topicsDiscussed: state.fundraisingTopicsDiscussed.length },
          promptAddition
        };
      }

      // Check if ready for donation ask
      if (fundraisingService.isReadyForDonationAsk(
        state.conversationTurn,
        state.fundraisingTopicsDiscussed as FundraisingTopic[]
      )) {
        const donationAsk = fundraisingService.getDonationAsk('medium');
        return {
          action: 'adult_educational',
          context: { readyForAsk: true },
          promptAddition: `ADULT MODE: Continue the conversation naturally, and end with this invitation: "${donationAsk}" Stay in Mia's voice. 5-6 sentences.`
        };
      }

      // General ADULT mode response
      return {
        action: 'adult_educational',
        context: {},
        promptAddition: `ADULT MODE: Respond to their question about Village of Life, Mirror Learning, or the program. Stay in Mia's voice — a 10-year-old sharing something she believes in. If they seem interested, share ${state.fundraisingTopicsDiscussed.length === 0 ? 'what VOL means to you' : 'another aspect of VOL'}. 5-6 sentences.`
      };
    }

    // Default casual response in Mirror Learning voice
    return {
      action: 'casual_response',
      context: {},
      promptAddition: 'Respond naturally as Mia in 2 sentences or less, staying in character'
    };
  }

  private async handleContextBasedTeaching(state: DialogueState, intent: string, message: string, conversationHistory: Array<{ role: string; content: string }>): Promise<{
    action: string;
    context: any;
    promptAddition: string;
  }> {
    // ⭐ TRIGGER LOGIC: Define scenario-triggering intents
    const scenarioTriggerIntents = [
      'medicine_topic',
      'substance_concern',
      'peer_pressure_topic',
      'needs_help',
      'vol_question'
    ];

    // ⭐ PROACTIVE SCENARIO TRIGGER: After VOL acknowledgment (turn 5+), actively guide toward scenarios
    // For children (ages 5-17), don't wait passively - push toward Mirror Learning
    const isReadyForScenarios = state.hasAskedAboutVOL && state.conversationTurn >= 6;
    const shouldTriggerScenario = scenarioTriggerIntents.includes(intent) || isReadyForScenarios;

    // If no current scenario, decide whether to initiate one
    if (!state.currentScenario || state.teachingStep === 0) {
      // ⭐ PROACTIVE: After turn 6, always try to find a relevant scenario based on conversation context
      if (!shouldTriggerScenario) {
        logger.info(`🎭 Turn ${state.conversationTurn}: Intent "${intent}" - continuing casual chat before next scenario`);
        return {
          action: 'casual_chat_no_trigger',
          context: {},
          promptAddition: 'Respond naturally as Mia (2-3 sentences). After this response, think about sharing a relevant experience from your life related to what they learned at VOL.'
        };
      }

      logger.info(`🎭 Turn ${state.conversationTurn}: Ready to trigger scenario - searching for relevant match...`);
      const scenario = await this.selectScenario(state.userAge, state.lastIntent, state.scenariosCompleted, conversationHistory);

      if (!scenario) {
        return {
          action: 'no_scenarios',
          context: {},
          promptAddition: 'Chat casually (no scenarios available). 2 sentences max.'
        };
      }

      state.currentScenario = scenario;
      state.teachingStep = 1;

      logger.info(`🎭 Starting scenario ${scenario.id}: "${scenario.title}"`);

      // Step 1: Context - Present scenario naturally (longer, more detailed)
      return {
        action: 'ml_step_1_context',
        context: { scenario: scenario.id, step: 1 },
        promptAddition: `Share this experience from your life naturally (connect it to what they learned at VOL if possible): "${scenario.context}" Then present your dilemma: "${scenario.dilemma}" Use up to 10 sentences. Be vulnerable, authentic, and detailed. Paint the picture. Wait for their response.`
      };
    }

    // Progress through teaching steps (Mirror Learning pattern)
    const scenario = state.currentScenario;

    switch (state.teachingStep) {
      case 1:
        // Step 2: First Question (context + dilemma already presented in step 1)
        state.teachingStep = 2;
        return {
          action: 'ml_step_2_question',
          context: { scenario: scenario.id, step: 2 },
          promptAddition: `Ask for their help with the first question: "${scenario.questions[0]}" Show genuine curiosity about what they think. 3-4 sentences.`
        };

      case 2:
        // Step 3: Second Question - Dig deeper
        state.teachingStep = 3;
        return {
          action: 'ml_step_3_question_2',
          context: { scenario: scenario.id, step: 3 },
          promptAddition: `React to their first answer authentically (2-3 sentences), then ask the second question: "${scenario.questions[1]}" Be genuinely curious. Total 4-5 sentences.`
        };

      case 3:
        // Step 4: Third Question - Explore implications
        state.teachingStep = 4;
        return {
          action: 'ml_step_4_question_3',
          context: { scenario: scenario.id, step: 4 },
          promptAddition: `React thoughtfully to their second answer (2-3 sentences), then ask: "${scenario.questions[2]}" Show you're thinking deeply about this. Total 4-5 sentences.`
        };

      case 4:
        // Step 5: Process their teaching
        state.teachingStep = 5;
        return {
          action: 'ml_step_5_process',
          context: { scenario: scenario.id, step: 5 },
          promptAddition: `React authentically to all their teaching (as a 10-year-old would). Show you understand and appreciate their wisdom. Summarize what you learned from them. 5-6 sentences.`
        };

      case 5:
        // Step 6: Apply teaching with specific example
        state.teachingStep = 6;
        return {
          action: 'ml_step_6_apply',
          context: { scenario: scenario.id, step: 6 },
          promptAddition: `Show how you'll apply their advice with a concrete example from your life. Example: "So next time Marcus offers pills, I'll say no and tell Grandma." Be specific and personal. 4-5 sentences.`
        };

      case 6:
        // Step 7: Gratitude and complete
        state.teachingStep = 0;
        state.scenariosCompleted.push(scenario.id);
        state.currentScenario = null;

        logger.info(`✅ Completed scenario ${scenario.id}`);

        return {
          action: 'ml_step_7_gratitude',
          context: { scenario: scenario.id, step: 7, completed: true },
          promptAddition: `Thank them genuinely and specifically. Say what you learned from them and how it helps you feel more confident. Then naturally transition to casual conversation or ask if they want to talk about something else. 4-5 sentences total.`
        };

      default:
        state.teachingStep = 0;
        state.currentScenario = null;
        return {
          action: 'casual_response',
          context: {},
          promptAddition: 'Respond naturally as Mia. 2 sentences max.'
        };
    }
  }

  private extractName(message: string): string | null {
    const patterns = [
      /my name is (\w+)/i,
      /i'm (\w+)/i,
      /call me (\w+)/i,
      /(\w+)$/
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
      }
    }
    return null;
  }

  private extractVOLStation(message: string): string {
    const lower = message.toLowerCase();
    const stations = [
      'pharmacy', 'medicine', 'medication',
      'emergency', 'ambulance', '911',
      'wellness', 'health', 'doctor',
      'counseling', 'therapy', 'feelings',
      'safety', 'danger', 'help',
      'family', 'home', 'parents',
      'art', 'drawing', 'painting',
      'music', 'singing',
      'sports', 'exercise'
    ];

    for (const station of stations) {
      if (lower.includes(station)) {
        // Normalize to main station names
        if (['pharmacy', 'medicine', 'medication'].includes(station)) return 'pharmacy';
        if (['emergency', 'ambulance', '911'].includes(station)) return 'emergency';
        if (['wellness', 'health', 'doctor'].includes(station)) return 'wellness';
        if (['counseling', 'therapy', 'feelings'].includes(station)) return 'counseling';
        if (['safety', 'danger', 'help'].includes(station)) return 'safety';
        if (['family', 'home', 'parents'].includes(station)) return 'family';
        if (['art', 'drawing', 'painting'].includes(station)) return 'art';
        if (['music', 'singing'].includes(station)) return 'music';
        if (['sports', 'exercise'].includes(station)) return 'sports';
        return station;
      }
    }
    return 'a station';
  }

  private extractScenarioKeywords(text: string): string[] {
    const keywords: string[] = [];
    const lower = text.toLowerCase();

    // Medicine/pharmacy keywords
    if (/(medicine|medication|pills|pharmacy|prescription|dose|dosage)/i.test(lower)) {
      keywords.push('medicine', 'medication', 'pharmacy');
    }

    // Label reading keywords
    if (/(label|reading|bottle|warning|symbol|instructions)/i.test(lower)) {
      keywords.push('label', 'reading', 'bottle');
    }

    // Peer pressure keywords
    if (/(friend|peer|pressure|everyone|party)/i.test(lower)) {
      keywords.push('peer', 'pressure', 'friend');
    }

    // Danger recognition keywords
    if (/(danger|unsafe|stranger|weird|sketchy|suspicious)/i.test(lower)) {
      keywords.push('danger', 'unsafe', 'stranger');
    }

    // Help & response keywords
    if (/(help|scared|afraid|worried|911|emergency|crisis)/i.test(lower)) {
      keywords.push('help', 'scared', '911');
    }

    return [...new Set(keywords)]; // Remove duplicates
  }

  // Get scenario by ID
  getScenario(scenarioId: string): Scenario | null {
    return SCENARIO_BANK.find(s => s.id === scenarioId) || null;
  }

  // Get all scenarios for a lesson
  getScenariosByLesson(lesson: number): Scenario[] {
    return SCENARIO_BANK.filter(s => s.lesson === lesson);
  }

  // Get completed scenarios count
  getProgress(sessionId: string): { completed: number; total: number; percentage: number } {
    const state = this.getState(sessionId);
    const total = SCENARIO_BANK.length;
    const completed = state.scenariosCompleted.length;
    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100)
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 🆕 REFLECTION BUFFER MANAGEMENT (In-Context Identity Architecture)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Update reflection buffer after each conversation turn
   * Extracts emotional state and topic from user/assistant messages
   *
   * @param sessionId - Session identifier
   * @param userMessage - User's message
   * @param miaResponse - Mia's response
   */
  updateReflectionBuffer(
    sessionId: string,
    userMessage: string,
    miaResponse: string
  ): void {
    const state = this.getState(sessionId);

    // Extract emotional state from Mia's response
    const emotionalKeywords: Record<string, RegExp> = {
      scared: /scared|afraid|terrified|nervous|frightened/i,
      anxious: /worried|anxious|stressed|uncertain|concerned/i,
      calm: /okay|fine|good|peaceful|relaxed/i,
      excited: /excited|happy|awesome|cool|amazing/i,
      confused: /confused|don'?t get it|don'?t understand|unclear/i,
      curious: /wonder|curious|interesting|hmm|maybe/i
    };

    // Check Mia's response for emotional keywords
    for (const [emotion, regex] of Object.entries(emotionalKeywords)) {
      if (regex.test(miaResponse)) {
        state.reflectionBuffer.emotionalState = emotion as any;
        break;
      }
    }

    // Extract topic from recent conversation
    const topicKeywords: Record<string, RegExp> = {
      'medicine': /medicine|pill|medication|prescription|drug/i,
      'peer_pressure': /friend|pressure|everyone|party|offered/i,
      'safety': /danger|unsafe|scary|911|emergency/i,
      'label_reading': /label|bottle|warning|dosage|instructions/i,
      'help_seeking': /help|tell|adult|grandma|teacher/i,
      'wellness': /sick|hurt|doctor|nurse|hospital/i,
      'decision_making': /choose|decision|should|what if/i,
      'VOL_discussion': /village of life|VOL|station|pharmacy|wellness/i
    };

    // Check both user message and Mia's response for topics
    const combinedText = `${userMessage} ${miaResponse}`;
    for (const [topic, regex] of Object.entries(topicKeywords)) {
      if (regex.test(combinedText)) {
        state.reflectionBuffer.currentTopic = topic;
        break;
      }
    }

    // Track which lesson was applied (if scenario active)
    if (state.currentScenario) {
      state.reflectionBuffer.lastLessonApplied = `L${state.currentScenario.lesson}`;
    }

    logger.info(`🧩 Reflection Buffer Updated:`);
    logger.info(`   Emotional State: ${state.reflectionBuffer.emotionalState}`);
    logger.info(`   Current Topic: ${state.reflectionBuffer.currentTopic}`);
    logger.info(`   Last Lesson: ${state.reflectionBuffer.lastLessonApplied || 'None'}`);
  }
}

export const dialogueManager = new DialogueManager();
