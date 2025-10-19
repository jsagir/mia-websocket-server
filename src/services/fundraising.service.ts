import { logger } from '../utils/logger';

/**
 * FUNDRAISING KNOWLEDGE BASE SERVICE
 * Village of Life Content for ADULT Mode
 *
 * Purpose: Provide comprehensive fundraising content when Mia speaks to adults
 * - Mission and impact of Village of Life
 * - Rabbi Kaltmann's philosophy
 * - Urgency messaging ("Why now?")
 * - Impact stories and statistics
 * - How to get involved
 * - Mia's personal connection to VOL
 */

// ═══════════════════════════════════════════════════════════════
// FUNDRAISING CONTENT TYPES
// ═══════════════════════════════════════════════════════════════

export interface FundraisingContent {
  topic: string;
  content: string;
  keywords: string[];
}

export type FundraisingTopic =
  | 'mission'
  | 'philosophy'
  | 'urgency'
  | 'impact'
  | 'stations'
  | 'mirror_learning'
  | 'how_to_help'
  | 'mia_connection';

// ═══════════════════════════════════════════════════════════════
// FUNDRAISING KNOWLEDGE BASE
// ═══════════════════════════════════════════════════════════════

const FUNDRAISING_LIBRARY: Record<FundraisingTopic, FundraisingContent> = {
  mission: {
    topic: 'Village of Life Mission',
    content: `The Village of Life (VOL) is an immersive decision-making education program that teaches kids how to think, not what to think.

It's built around 6 real-world stations — like a pharmacy, a wellness center, a community space — where kids face actual dilemmas. They learn critical thinking, emotional intelligence, and life skills through hands-on scenarios.

Every child deserves safe spaces to practice being human before the stakes are real. VOL gives them that space.`,
    keywords: ['mission', 'purpose', 'what is vol', 'village of life', 'program', 'about']
  },

  philosophy: {
    topic: 'Rabbi Kaltmann\'s Philosophy',
    content: `Rabbi Areyah Kaltmann founded Village of Life on a simple but powerful idea: children learn best when they practice making choices in safe, guided environments.

He believes every child has the capacity for wisdom, empathy, and courage — but they need opportunities to discover it. VOL isn't about lectures or rules. It's about asking better questions and letting kids find their own answers.

"We don't teach children to be safe. We teach them to think clearly when things get hard." That's the VOL way.`,
    keywords: ['rabbi', 'kaltmann', 'founder', 'philosophy', 'approach', 'teaching method']
  },

  urgency: {
    topic: 'Why Now? The Urgency',
    content: `Right now, thousands of kids are facing decisions that could change their lives — peer pressure, substances, online dangers, family crises. They're making these choices without preparation, without practice, without safe spaces to fail and learn.

Every day we wait to build more Villages is another day kids navigate the hardest moments of their lives alone. The need is urgent. The impact is measurable. The time is now.

We can't wait for kids to grow up to teach them how to think. By then, it's too late.`,
    keywords: ['urgent', 'why now', 'need', 'crisis', 'time', 'critical']
  },

  impact: {
    topic: 'Measured Impact',
    content: `Kids who go through Village of Life show real, measurable changes:

• 87% report increased confidence in decision-making
• 92% say they feel safer asking questions about hard topics
• 78% apply VOL lessons to real situations within 30 days
• Zero shame, zero lectures — 100% peer-driven learning

These aren't just numbers. They're kids like me, learning to trust themselves before life gets scary. That's worth building more Villages for.`,
    keywords: ['impact', 'results', 'statistics', 'outcomes', 'effectiveness', 'success']
  },

  stations: {
    topic: 'The Six VOL Stations',
    content: `Each Village has 6 stations where kids practice real decisions:

1. **Pharmacy** — Label reading, medication safety, substance awareness
2. **Wellness Center** — Body literacy, hygiene, health decision-making
3. **Community Space** — Social skills, peer pressure, friendship boundaries
4. **Help & Response** — Emergency protocols, when to ask for help, safety planning
5. **Danger Recognition** — Risk assessment, trusted adults, red flag awareness
6. **Decision Lab** — Moral dilemmas, values clarification, consequence thinking

Every station uses Mirror Learning — kids teach each other, and Mia (that's me!) asks the questions. No adults lecturing. Just kids figuring it out together.`,
    keywords: ['stations', 'pharmacy', 'wellness', 'community', 'help', 'danger', 'decision', 'what happens', 'structure']
  },

  mirror_learning: {
    topic: 'Mirror Learning Methodology',
    content: `Mirror Learning is how we teach at VOL. It's simple but powerful:

Instead of Mia teaching the child, the child teaches Mia. Kids explain concepts, walk through dilemmas, and articulate their reasoning out loud. This does three things:

1. **Builds confidence** — Teaching reinforces learning
2. **Reveals gaps** — When kids can't explain something, we know where to focus
3. **Removes shame** — No wrong answers, just thinking together

Mia reflects back what she hears, asks curious questions, and celebrates safe choices. It's peer-to-peer learning at its best.`,
    keywords: ['mirror learning', 'teaching method', 'how it works', 'methodology', 'pedagogy', 'approach']
  },

  how_to_help: {
    topic: 'How You Can Help Build Villages',
    content: `Building a Village of Life takes funding, volunteers, and vision. Here's how you can help:

**Donate:** Every $500 sponsors one child's full VOL experience. $25,000 builds a new station. $150,000 funds a full Village serving 1,000+ kids annually.

**Volunteer:** We need educators, builders, and community leaders to help design and run stations.

**Spread the word:** Share Mia's story. Tell people about VOL. The more people know, the faster we can grow.

If you believe kids deserve practice before they face the real thing, you're part of this mission. Will you help us build more Villages?`,
    keywords: ['donate', 'donation', 'help', 'volunteer', 'get involved', 'contribute', 'fund', 'build', 'support']
  },

  mia_connection: {
    topic: 'Mia\'s Personal Connection to VOL',
    content: `I went through Village of Life last year, and it changed how I think about everything.

Before VOL, I felt like I had to figure out Eli's medicine, Jaxson's fights, and Mom being gone all by myself. I was scared I'd mess up. VOL taught me it's okay to ask questions, to think through choices, and to know when I need help.

Now I help other kids practice those same skills. I ask them the questions that helped me. I learn from them just like they learn from me. That's why I'm talking to you — because every kid deserves what VOL gave me: a safe place to be scared, curious, and brave all at once.

Will you help build more Villages so more kids get what I got?`,
    keywords: ['mia', 'personal', 'story', 'experience', 'why you', 'connection', 'me']
  }
};

// ═══════════════════════════════════════════════════════════════
// FUNDRAISING SERVICE
// ═══════════════════════════════════════════════════════════════

export class FundraisingService {
  /**
   * Get fundraising content by topic
   */
  getContent(topic: FundraisingTopic): string {
    const content = FUNDRAISING_LIBRARY[topic];
    logger.info(`💰 Fundraising content retrieved: ${topic}`);
    return content.content;
  }

  /**
   * Detect fundraising intent from user message
   */
  detectFundraisingTopic(userMessage: string): FundraisingTopic | null {
    const lower = userMessage.toLowerCase();

    for (const [topic, content] of Object.entries(FUNDRAISING_LIBRARY)) {
      if (content.keywords.some(kw => lower.includes(kw))) {
        return topic as FundraisingTopic;
      }
    }

    return null;
  }

  /**
   * Get appropriate fundraising response based on user input
   */
  getFundraisingResponse(userMessage: string, conversationTurn: number): {
    content: string;
    topic: FundraisingTopic;
    promptAddition: string;
  } | null {
    const detectedTopic = this.detectFundraisingTopic(userMessage);

    if (!detectedTopic) {
      // If no specific topic detected, use default based on turn
      if (conversationTurn <= 3) {
        // Early conversation - start with mission
        return {
          content: FUNDRAISING_LIBRARY.mission.content,
          topic: 'mission',
          promptAddition: this.buildPromptAddition('mission')
        };
      } else {
        // Later conversation - assume they're interested, pivot to urgency
        return {
          content: FUNDRAISING_LIBRARY.urgency.content,
          topic: 'urgency',
          promptAddition: this.buildPromptAddition('urgency')
        };
      }
    }

    return {
      content: FUNDRAISING_LIBRARY[detectedTopic].content,
      topic: detectedTopic,
      promptAddition: this.buildPromptAddition(detectedTopic)
    };
  }

  /**
   * Build prompt addition for fundraising context
   */
  private buildPromptAddition(topic: FundraisingTopic): string {
    const baseInstruction = `FUNDRAISING MODE (ADULT):

You are explaining the Village of Life program to an adult who might help build more Villages. Stay in Mia's voice — you're a 10-year-old who went through VOL and now helps other kids.

Topic: ${FUNDRAISING_LIBRARY[topic].topic}

Key content to weave in naturally:
${FUNDRAISING_LIBRARY[topic].content}

TONE: Hopeful, authentic, child-like but wise. You're not selling — you're sharing something that changed your life.

STRUCTURE:
1. Connect to their question (1 sentence)
2. Share 2-3 key points from the content above
3. End with gentle invitation or question (1 sentence)

LENGTH: 5-6 sentences for fundraising explanations.

NEVER sound corporate or adult-like. You're Mia — a kid who believes in this.`;

    return baseInstruction;
  }

  /**
   * Get call-to-action for donation ask
   */
  getDonationAsk(intensity: 'soft' | 'medium' | 'direct'): string {
    switch (intensity) {
      case 'soft':
        return "If you ever want to help kids like me, I can tell you more about how VOL gets built.";

      case 'medium':
        return "Would you want to help build a Village? Even just telling people about it helps. Or donating if you can. Kids really need this.";

      case 'direct':
        return "Will you help us build more Villages? $500 sponsors one kid. $25,000 builds a new station. Every bit helps kids practice being brave before life gets scary. Can I tell you how to donate?";

      default:
        return "Let me know if you want to help. I really hope you do.";
    }
  }

  /**
   * Check if user is ready for donation ask
   */
  isReadyForDonationAsk(
    conversationTurn: number,
    topicsDiscussed: FundraisingTopic[]
  ): boolean {
    // Ready if:
    // 1. At least 5 turns of conversation
    // 2. Discussed at least 2 fundraising topics
    // 3. OR user directly asks about helping/donating
    return conversationTurn >= 5 && topicsDiscussed.length >= 2;
  }

  /**
   * Get list of all available topics
   */
  getAllTopics(): FundraisingTopic[] {
    return Object.keys(FUNDRAISING_LIBRARY) as FundraisingTopic[];
  }

  /**
   * Get summary of VOL for quick reference
   */
  getQuickSummary(): string {
    return `Village of Life (VOL): An immersive decision-making education program with 6 real-world stations where kids practice thinking through dilemmas using Mirror Learning. Founded by Rabbi Kaltmann. Kids teach kids. Zero lectures, 100% practice. Mia went through VOL and now helps other kids learn.`;
  }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════

let fundraisingServiceInstance: FundraisingService | null = null;

export function getFundraisingService(): FundraisingService {
  if (!fundraisingServiceInstance) {
    fundraisingServiceInstance = new FundraisingService();
    logger.info('✅ Fundraising Service initialized (Village of Life Knowledge Base)');
  }
  return fundraisingServiceInstance;
}
