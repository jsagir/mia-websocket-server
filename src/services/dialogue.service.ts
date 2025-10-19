import { logger } from '../utils/logger';

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
  currentMode: 'GREETING' | 'MIRROR_LEARNING' | 'EDUCATIONAL' | 'FUNDRAISING' | 'URGENCY';
  mirrorLearningStep: number; // 0-7 for the 7-step pattern
  currentScenario: Scenario | null;
  scenariosCompleted: string[];
  conversationTurn: number;
  lastIntent: string;
  hasAskedName: boolean;
  hasAskedAge: boolean;
  userName: string | null;
  userAge: number | null;
}

// Scenario Bank - 24 scenarios across 6 lessons
const SCENARIO_BANK: Scenario[] = [
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
        currentMode: 'MIRROR_LEARNING', // ⭐ ALWAYS start with Mirror Learning
        mirrorLearningStep: 0,
        currentScenario: null,
        scenariosCompleted: [],
        conversationTurn: 0,
        lastIntent: 'greeting',
        hasAskedName: false,
        hasAskedAge: false,
        userName: null,
        userAge: null
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

    // Mirror Learning responses
    if (state.currentMode === 'MIRROR_LEARNING' && state.currentScenario) {
      if (/(yes|yeah|yep|no|nope|should|would|could)/i.test(lower)) return 'ml_response';
    }

    // Scenario triggers
    if (/(medicine|pills|sick|doctor)/i.test(lower)) return 'medicine_topic';
    if (/(friend|pressure|party|everyone)/i.test(lower)) return 'peer_pressure_topic';
    if (/(help|don't know|scared|afraid)/i.test(lower)) return 'needs_help';

    return 'casual_chat';
  }

  // Select scenario based on conversation context ONLY (not age)
  selectScenario(age: number | null, lastIntent: string, completedScenarios: string[]): Scenario | null {
    // ⭐ NO AGE FILTERING - all scenarios available regardless of age
    const availableScenarios = SCENARIO_BANK.filter(s =>
      !completedScenarios.includes(s.id)
    );

    if (availableScenarios.length === 0) return null;

    // ⭐ CONTEXT-AWARE: Match scenario to conversation intent/topic
    let filteredScenarios = availableScenarios;

    if (lastIntent === 'medicine_topic' || lastIntent === 'substance_concern') {
      // Lessons 1 & 2: Wellness and Medication Safety
      filteredScenarios = availableScenarios.filter(s => s.lesson === 1 || s.lesson === 2);
    } else if (lastIntent === 'peer_pressure_topic') {
      // Lesson 3: Decision Making
      filteredScenarios = availableScenarios.filter(s => s.lesson === 3);
    } else if (lastIntent === 'needs_help') {
      // Lesson 6: Help & Response
      filteredScenarios = availableScenarios.filter(s => s.lesson === 6);
    } else if (lastIntent === 'vol_question') {
      // Any scenario related to Village of Life
      filteredScenarios = availableScenarios;
    }

    // If no context matches, use any available scenario
    if (filteredScenarios.length === 0) filteredScenarios = availableScenarios;

    // Return random scenario from context-filtered list
    return filteredScenarios[Math.floor(Math.random() * filteredScenarios.length)];
  }

  // Process user message and return dialogue action
  processMessage(sessionId: string, message: string, userAge: number | null): {
    action: string;
    context: any;
    promptAddition: string;
  } {
    const state = this.getState(sessionId);
    state.conversationTurn++;

    // Detect intent
    const intent = this.detectIntent(message, state);
    state.lastIntent = intent;

    logger.info(`🎭 Session ${sessionId}: Intent="${intent}", Mode="${state.currentMode}", ML Step=${state.mirrorLearningStep}`);

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

    // Update user age if detected (informational only, doesn't change mode)
    if (userAge && !state.userAge) {
      state.userAge = userAge;
      logger.info(`🎭 User age detected: ${userAge} (informational only)`);

      // ⭐ STAY IN MIRROR_LEARNING - just acknowledge age and ask about VOL
      return {
        action: 'acknowledge_age',
        context: { age: userAge, userName: state.userName },
        promptAddition: `Respond with: "Hey ${state.userName}, did you just come from the Village of Life? Which station did you go to? I wanna know what you learned!" (Exactly this)`
      };
    }

    // ⭐ CRISIS always overrides everything
    if (intent === 'crisis') {
      return {
        action: 'crisis_response',
        context: { tier: 3 },
        promptAddition: 'SAFETY TIER 3: Respond with crisis support (2-3 sentences) and provide: 988 Suicide & Crisis Lifeline, Text HELLO to 741741, 911 if immediate danger'
      };
    }

    // ⭐ Handle EXPLICIT mode switches (user requests)
    if (intent === 'urgency') {
      state.currentMode = 'URGENCY';
      return {
        action: 'urgency_mode',
        context: {},
        promptAddition: 'Respond with: "You wanna know why we can\'t wait?" Then briefly explain urgency (3 sentences max)'
      };
    }

    if (intent === 'fundraising') {
      state.currentMode = 'FUNDRAISING';
      return {
        action: 'fundraising_mode',
        context: {},
        promptAddition: 'Respond with: "Are you someone who might help build more Villages? I really hope so..." Then share impact stories (3 sentences max)'
      };
    }

    // ⭐ MIRROR LEARNING is the default flow
    if (state.currentMode === 'MIRROR_LEARNING') {
      return this.handleMirrorLearning(state, intent, message);
    }

    // ⭐ Handle other explicit modes (URGENCY, FUNDRAISING, EDUCATIONAL)
    // If in these modes, respond accordingly but allow return to Mirror Learning
    if (state.currentMode === 'URGENCY' || state.currentMode === 'FUNDRAISING') {
      // After one response, return to Mirror Learning
      state.currentMode = 'MIRROR_LEARNING';
      return {
        action: 'return_to_mirror_learning',
        context: {},
        promptAddition: 'Respond briefly to their question (2 sentences), then ask: "Do you have other questions about the Village of Life?"'
      };
    }

    // Default casual response in Mirror Learning voice
    return {
      action: 'casual_response',
      context: {},
      promptAddition: 'Respond naturally as Mia in 2 sentences or less, staying in character'
    };
  }

  private handleMirrorLearning(state: DialogueState, intent: string, message: string): {
    action: string;
    context: any;
    promptAddition: string;
  } {
    // If no current scenario, initiate one
    if (!state.currentScenario || state.mirrorLearningStep === 0) {
      const scenario = this.selectScenario(state.userAge, state.lastIntent, state.scenariosCompleted);

      if (!scenario) {
        return {
          action: 'no_scenarios',
          context: {},
          promptAddition: 'Chat casually (no scenarios available). 2 sentences max.'
        };
      }

      state.currentScenario = scenario;
      state.mirrorLearningStep = 1;

      logger.info(`🎭 Starting scenario ${scenario.id}: "${scenario.title}"`);

      // Step 1: Context
      return {
        action: 'ml_step_1_context',
        context: { scenario: scenario.id, step: 1 },
        promptAddition: `Present this scenario context (exactly as written): "${scenario.context}" (Then wait for their response)`
      };
    }

    // Progress through Mirror Learning steps
    const scenario = state.currentScenario;

    switch (state.mirrorLearningStep) {
      case 1:
        // Step 2: Dilemma
        state.mirrorLearningStep = 2;
        return {
          action: 'ml_step_2_dilemma',
          context: { scenario: scenario.id, step: 2 },
          promptAddition: `Say: "${scenario.dilemma}" (Then ask the first question: "${scenario.questions[0]}")`
        };

      case 2:
        // Step 3-4: Questions and wait for teaching
        if (state.conversationTurn % 2 === 0) {
          const questionIndex = Math.min(Math.floor(state.conversationTurn / 2) - 1, scenario.questions.length - 1);
          return {
            action: 'ml_step_3_question',
            context: { scenario: scenario.id, step: 3, questionIndex },
            promptAddition: `React to their answer authentically (1 sentence), then ask: "${scenario.questions[questionIndex]}"`
          };
        } else {
          state.mirrorLearningStep = 3;
          return {
            action: 'ml_step_5_react',
            context: { scenario: scenario.id, step: 5 },
            promptAddition: `React authentically to their teaching (as a 10-year-old would). Show you understand. 2 sentences max.`
          };
        }

      case 3:
        // Step 6: Apply teaching
        state.mirrorLearningStep = 4;
        return {
          action: 'ml_step_6_apply',
          context: { scenario: scenario.id, step: 6 },
          promptAddition: `Show how you'll apply their advice. Example: "So next time Marcus offers pills, I'll say no and tell Grandma." (2 sentences)`
        };

      case 4:
        // Step 7: Gratitude and complete
        state.mirrorLearningStep = 0;
        state.scenariosCompleted.push(scenario.id);
        state.currentScenario = null;

        logger.info(`✅ Completed scenario ${scenario.id}`);

        return {
          action: 'ml_step_7_gratitude',
          context: { scenario: scenario.id, step: 7, completed: true },
          promptAddition: `Thank them genuinely: "Thank you so much for helping me! You taught me [key lesson]." (2 sentences, then transition to casual chat)`
        };

      default:
        state.mirrorLearningStep = 0;
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
}

export const dialogueManager = new DialogueManager();
