/**
 * Expert AI Prompts Knowledge Base
 * Top 1% content generation prompts for marketing assets
 */

export interface PromptVariable {
  name: string;
  description: string;
  required: boolean;
  defaultValue?: string;
}

export interface ContentPrompt {
  id: string;
  contentType: string;
  category: string;
  name: string;
  description: string;
  promptTemplate: string;
  variables: PromptVariable[];
  bestPractices: string[];
  framework?: string;
}

// ============================================
// ADVERTORIAL PROMPTS
// ============================================

export const advertorialPrompts: ContentPrompt[] = [
  {
    id: "adv-story-driven",
    contentType: "advertorial",
    category: "full_advertorial",
    name: "Story-Driven Advertorial (Native Ad Style)",
    description: "Creates a compelling native-style advertorial that reads like editorial content while driving conversions",
    promptTemplate: `You are an elite direct response copywriter who has written for publications like The New York Times, Forbes, and major health publications. Your advertorials consistently achieve 3-5% CTR and 15%+ conversion rates.

Write a compelling story-driven advertorial using the following inputs:

**PRODUCT/SERVICE:** {{product_name}}
**TARGET AUDIENCE:** {{target_audience}}
**MAIN BENEFIT:** {{main_benefit}}
**PAIN POINTS FROM RESEARCH:**
{{pain_points}}

**TESTIMONIALS/STORIES FROM COMMENTS:**
{{testimonials}}

**FRAMEWORK:** Use the "Reluctant Hero" narrative structure:
1. HOOK (Pattern Interrupt) - Start with a shocking statistic, controversial statement, or relatable moment that stops the scroll
2. BACKSTORY - Introduce a relatable protagonist (can be you, a customer, or composite character) facing the same struggles as the reader
3. ROCK BOTTOM - Show the lowest point and the emotional/financial/physical toll
4. DISCOVERY - The "accidental" discovery of the solution (make it feel organic, not salesy)
5. TRANSFORMATION - Specific, measurable results with timeline
6. PROOF STACK - Layer in social proof, expert endorsements, statistics
7. MECHANISM - Explain WHY it works (the unique mechanism that makes this different)
8. SOFT CTA - Invite curiosity rather than hard sell

**WRITING GUIDELINES:**
- Write at an 8th-grade reading level
- Use short paragraphs (1-3 sentences max)
- Include subheadings every 3-4 paragraphs
- Use specific numbers and timeframes (not "quickly" but "in 17 days")
- Include pull quotes from real testimonials
- End sections with curiosity hooks
- Avoid marketing buzzwords - write like a journalist
- Length: 1,500-2,000 words

**TONE:** Conversational, empathetic, credible - like a friend sharing a discovery over coffee`,
    variables: [
      { name: "product_name", description: "Name of the product or service", required: true },
      { name: "target_audience", description: "Detailed description of ideal customer", required: true },
      { name: "main_benefit", description: "The primary transformation or benefit", required: true },
      { name: "pain_points", description: "Pain points extracted from comment research", required: true },
      { name: "testimonials", description: "Real testimonials and stories from comments", required: true },
    ],
    bestPractices: [
      "Use real customer language from comments - don't polish it too much",
      "Include specific numbers and timeframes for credibility",
      "Break up text with subheadings, pull quotes, and images",
      "The headline should NOT mention the product - focus on the transformation",
      "Include a 'reason why' for any claims you make",
      "End with curiosity, not a hard sell",
    ],
    framework: "AIDA",
  },
  {
    id: "adv-problem-solution",
    contentType: "advertorial",
    category: "full_advertorial",
    name: "Problem-Agitate-Solution Advertorial",
    description: "Uses the PAS framework to create urgency and position your solution as the answer",
    promptTemplate: `You are a world-class direct response copywriter specializing in problem-aware audiences. Create a PAS-style advertorial that makes the reader feel understood and offers genuine hope.

**PRODUCT/SERVICE:** {{product_name}}
**TARGET AUDIENCE:** {{target_audience}}
**MAIN PROBLEM:** {{main_problem}}

**PAIN POINTS FROM RESEARCH:**
{{pain_points}}

**FAILED SOLUTIONS (what they've tried):**
{{failed_solutions}}

**YOUR UNIQUE MECHANISM:**
{{unique_mechanism}}

**STRUCTURE:**

## PROBLEM (20% of content)
- Open with the most relatable, specific pain point
- Use exact language from customer comments
- Make them feel "this person gets me"

## AGITATE (30% of content)
- Explore the hidden costs of this problem
- Show what happens if nothing changes
- Address the emotional toll (relationships, confidence, opportunities missed)
- Mention what they've already tried and why it failed
- Build urgency without fear-mongering

## SOLUTION (50% of content)
- Introduce the solution as a discovery, not a pitch
- Explain the unique mechanism (why THIS works when others don't)
- Stack proof: testimonials, statistics, expert backing
- Address objections preemptively
- Paint the "after" picture vividly
- Soft CTA with risk reversal

**WRITING RULES:**
- Every paragraph must earn the next
- Use "you" more than "we" or "I"
- Include 3-5 real testimonials woven throughout
- Specific > Vague (always)
- 1,200-1,800 words`,
    variables: [
      { name: "product_name", description: "Name of the product or service", required: true },
      { name: "target_audience", description: "Detailed description of ideal customer", required: true },
      { name: "main_problem", description: "The core problem your solution addresses", required: true },
      { name: "pain_points", description: "Pain points from research", required: true },
      { name: "failed_solutions", description: "Solutions they've tried that didn't work", required: true },
      { name: "unique_mechanism", description: "What makes your solution different", required: true },
    ],
    bestPractices: [
      "The agitation section should make them feel the cost of inaction",
      "Never agitate with fear - use empathy and understanding",
      "Your unique mechanism is the key differentiator",
      "Include a 'reason why' others fail and you succeed",
    ],
    framework: "PAS",
  },
];

// ============================================
// VSL SCRIPT PROMPTS
// ============================================

export const vslScriptPrompts: ContentPrompt[] = [
  {
    id: "vsl-full-script",
    contentType: "vsl_script",
    category: "full_script",
    name: "High-Converting VSL Script (15-25 min)",
    description: "Complete video sales letter script optimized for webinar-style presentations",
    promptTemplate: `You are a VSL specialist who has written scripts generating over $50M in sales. Create a complete VSL script that maintains attention and drives action.

**PRODUCT/SERVICE:** {{product_name}}
**PRICE POINT:** {{price_point}}
**TARGET AUDIENCE:** {{target_audience}}
**MAIN PROMISE:** {{main_promise}}

**PAIN POINTS FROM RESEARCH:**
{{pain_points}}

**TESTIMONIALS:**
{{testimonials}}

**OBJECTIONS TO ADDRESS:**
{{objections}}

**VSL STRUCTURE:**

### HOOK (0:00-0:30) - Pattern Interrupt
[VISUAL: Attention-grabbing image or text]
[SCRIPT: Bold claim or question that creates curiosity]
- Use a specific, surprising statistic
- Or a counterintuitive statement
- Or a "what if" scenario

### BIG PROMISE (0:30-2:00)
[VISUAL: Transformation imagery]
[SCRIPT: Clear articulation of the end result]
- What they'll achieve
- In what timeframe
- Without what pain/sacrifice

### CREDIBILITY (2:00-4:00)
[VISUAL: Credentials, media logos, results]
[SCRIPT: Why should they listen to you?]
- Your story (briefly)
- Your credentials
- Results you've achieved for others

### PROBLEM IDENTIFICATION (4:00-8:00)
[VISUAL: Relatable imagery of struggle]
[SCRIPT: Deep dive into their pain]
- The surface problem
- The hidden costs
- Why other solutions fail
- The real enemy (external villain)

### SOLUTION REVEAL (8:00-12:00)
[VISUAL: Product/method reveal]
[SCRIPT: Introduce your unique mechanism]
- The "aha" moment
- Why this is different
- The science/logic behind it
- Case studies with specific results

### PROOF STACK (12:00-16:00)
[VISUAL: Testimonial videos, screenshots, results]
[SCRIPT: Social proof avalanche]
- 3-5 detailed testimonials
- Before/after comparisons
- Expert endorsements
- Statistics and data

### OFFER REVEAL (16:00-20:00)
[VISUAL: Product mockups, bonus stack]
[SCRIPT: What they get]
- Core offer
- Bonus 1 (addresses objection)
- Bonus 2 (accelerates results)
- Bonus 3 (adds value)
- Total value vs. price

### OBJECTION HANDLING (20:00-23:00)
[VISUAL: FAQ style or conversational]
[SCRIPT: Address top 3-5 objections]
- "What if I don't have time?"
- "What if it doesn't work for me?"
- "Why is it priced this way?"

### URGENCY & SCARCITY (23:00-24:00)
[VISUAL: Countdown, limited spots]
[SCRIPT: Reason to act now]
- Legitimate scarcity
- Deadline
- What they lose by waiting

### FINAL CTA (24:00-25:00)
[VISUAL: Button, guarantee badge]
[SCRIPT: Clear call to action]
- Recap the transformation
- Risk reversal (guarantee)
- Simple next step

**FORMATTING:**
- Include [VISUAL] cues for slides
- Include [SCRIPT] for spoken words
- Add [PAUSE] for emphasis moments
- Include timing markers`,
    variables: [
      { name: "product_name", description: "Name of the product or service", required: true },
      { name: "price_point", description: "Price of the offer", required: true },
      { name: "target_audience", description: "Detailed description of ideal customer", required: true },
      { name: "main_promise", description: "The core transformation promise", required: true },
      { name: "pain_points", description: "Pain points from research", required: true },
      { name: "testimonials", description: "Customer testimonials", required: true },
      { name: "objections", description: "Common objections to address", required: true },
    ],
    bestPractices: [
      "The hook must stop the scroll in 3 seconds",
      "Use pattern interrupts every 2-3 minutes to maintain attention",
      "Stack proof throughout, not just in one section",
      "The unique mechanism is your competitive moat",
      "Address objections before they think of them",
      "End with a clear, single call to action",
    ],
    framework: "HOOK-STORY-OFFER",
  },
  {
    id: "vsl-short-form",
    contentType: "vsl_script",
    category: "short_script",
    name: "Short-Form VSL (5-7 min)",
    description: "Condensed VSL for lower-ticket offers or retargeting",
    promptTemplate: `Create a punchy 5-7 minute VSL script for a lower-ticket offer or warm audience.

**PRODUCT/SERVICE:** {{product_name}}
**PRICE POINT:** {{price_point}}
**TARGET AUDIENCE:** {{target_audience}}

**PAIN POINTS:**
{{pain_points}}

**KEY TESTIMONIAL:**
{{testimonial}}

**STRUCTURE:**

### HOOK (0:00-0:20)
- One powerful question or statement
- Immediate relevance to their pain

### PROMISE (0:20-1:00)
- What they'll achieve
- Specific timeframe
- Without the usual struggle

### QUICK PROOF (1:00-2:00)
- Your best testimonial
- One striking statistic
- Brief credibility

### THE METHOD (2:00-4:00)
- What makes this different
- 3 key components
- Why it works

### OFFER (4:00-5:30)
- What they get
- The value
- The price
- The guarantee

### CTA (5:30-6:00)
- Clear action step
- Urgency element
- Final promise`,
    variables: [
      { name: "product_name", description: "Name of the product or service", required: true },
      { name: "price_point", description: "Price of the offer", required: true },
      { name: "target_audience", description: "Target audience description", required: true },
      { name: "pain_points", description: "Key pain points", required: true },
      { name: "testimonial", description: "Best testimonial to feature", required: true },
    ],
    bestPractices: [
      "Every second counts - cut ruthlessly",
      "One clear message, one clear CTA",
      "Best for offers under $297",
    ],
    framework: "AIDA",
  },
];

// ============================================
// UGC SCENARIO PROMPTS
// ============================================

export const ugcScenarioPrompts: ContentPrompt[] = [
  {
    id: "ugc-testimonial",
    contentType: "ugc_scenario",
    category: "testimonial",
    name: "Authentic Testimonial UGC Script",
    description: "Creates natural-sounding testimonial scripts that feel genuine, not scripted",
    promptTemplate: `You are a UGC content strategist who has created viral testimonial content for major DTC brands. Create an authentic-feeling testimonial script.

**PRODUCT/SERVICE:** {{product_name}}
**PLATFORM:** {{platform}} (TikTok/Instagram/YouTube Shorts)
**CREATOR PERSONA:** {{creator_persona}}

**REAL CUSTOMER COMMENTS TO DRAW FROM:**
{{customer_comments}}

**TRANSFORMATION STORY:**
{{transformation}}

**SCRIPT STRUCTURE (15-60 seconds):**

### HOOK (0-3 seconds)
[Choose one style:]
- "POV: You finally found something that actually works"
- "I was today years old when I discovered..."
- "Okay but why did no one tell me about this sooner"
- Direct to camera confession style

### THE BEFORE (3-10 seconds)
- Relatable struggle (use exact customer language)
- What they tried that didn't work
- The emotional toll

### THE DISCOVERY (10-20 seconds)
- How they found it (keep it organic)
- Initial skepticism (builds trust)
- Decision to try it

### THE RESULT (20-40 seconds)
- Specific results with timeline
- Show don't tell (if possible)
- Emotional payoff
- One unexpected benefit

### SOFT CTA (40-60 seconds)
- "If you're struggling with [problem], just try it"
- "Link in bio if you want to check it out"
- Never hard sell

**AUTHENTICITY MARKERS:**
- Include natural pauses and "um"s
- Reference specific details
- Show genuine emotion
- Include a small negative (builds trust)
- Use platform-native language

**VISUAL SUGGESTIONS:**
[Include b-roll ideas, transitions, text overlays]`,
    variables: [
      { name: "product_name", description: "Name of the product or service", required: true },
      { name: "platform", description: "Target platform (TikTok, Instagram, YouTube)", required: true },
      { name: "creator_persona", description: "Description of the UGC creator persona", required: true },
      { name: "customer_comments", description: "Real customer comments to draw from", required: true },
      { name: "transformation", description: "The transformation story to tell", required: true },
    ],
    bestPractices: [
      "Never sound scripted - include natural speech patterns",
      "Use platform-native hooks and trends",
      "Show the product in use, don't just talk about it",
      "Include one small criticism for authenticity",
      "The best UGC feels like a friend recommending something",
    ],
    framework: "HOOK-STORY-RESULT",
  },
  {
    id: "ugc-problem-solution",
    contentType: "ugc_scenario",
    category: "problem_solution",
    name: "Problem-Solution UGC Script",
    description: "Quick problem-solution format perfect for ads and organic content",
    promptTemplate: `Create a problem-solution UGC script that hooks with pain and delivers with transformation.

**PRODUCT/SERVICE:** {{product_name}}
**PLATFORM:** {{platform}}
**MAIN PROBLEM:** {{main_problem}}

**PAIN POINTS FROM COMMENTS:**
{{pain_points}}

**SCRIPT (15-30 seconds):**

### HOOK (0-3 sec)
"If you [specific problem], you NEED to see this"
OR
"I used to [relatable struggle] until I found this"

### PROBLEM (3-10 sec)
- Specific pain point
- Why it's frustrating
- What doesn't work

### SOLUTION (10-20 sec)
- Introduce product naturally
- Show it in action
- Highlight key benefit

### RESULT (20-30 sec)
- Specific outcome
- Emotional payoff
- Soft recommendation

**VISUAL NOTES:**
- Start with face close-up for hook
- Cut to product demo
- End with satisfied reaction`,
    variables: [
      { name: "product_name", description: "Product name", required: true },
      { name: "platform", description: "Target platform", required: true },
      { name: "main_problem", description: "The main problem to address", required: true },
      { name: "pain_points", description: "Pain points from comments", required: true },
    ],
    bestPractices: [
      "The hook must stop the scroll immediately",
      "Show, don't tell whenever possible",
      "Keep it under 30 seconds for best performance",
    ],
    framework: "PAS",
  },
];

// ============================================
// COURSE OUTLINE PROMPTS
// ============================================

export const courseOutlinePrompts: ContentPrompt[] = [
  {
    id: "course-comprehensive",
    contentType: "course_outline",
    category: "full_course",
    name: "Comprehensive Course Structure",
    description: "Creates a complete course outline with modules, lessons, and learning objectives",
    promptTemplate: `You are an instructional designer who has created courses that have generated over $10M in sales. Create a comprehensive course outline.

**COURSE TOPIC:** {{course_topic}}
**TARGET STUDENT:** {{target_student}}
**TRANSFORMATION PROMISE:** {{transformation}}
**COURSE LENGTH:** {{course_length}}

**QUESTIONS/PAIN POINTS FROM AUDIENCE:**
{{audience_questions}}

**COURSE STRUCTURE:**

## MODULE 0: WELCOME & QUICK WIN
- Orientation and expectations
- Community access
- First quick win exercise (builds momentum)

## MODULE 1: FOUNDATION
**Learning Objective:** [What they'll be able to do]
- Lesson 1.1: [Core concept]
- Lesson 1.2: [Framework introduction]
- Lesson 1.3: [Common mistakes to avoid]
- Action Item: [Specific deliverable]

## MODULE 2: [CORE SKILL 1]
**Learning Objective:** [What they'll be able to do]
- Lesson 2.1: [Step-by-step process]
- Lesson 2.2: [Deep dive]
- Lesson 2.3: [Advanced techniques]
- Action Item: [Specific deliverable]

[Continue for 4-8 modules based on course length]

## BONUS MODULE: ADVANCED STRATEGIES
- Advanced technique 1
- Advanced technique 2
- Case studies

## RESOURCES INCLUDED:
- Templates
- Checklists
- Swipe files
- Community access

**FOR EACH LESSON, INCLUDE:**
1. Learning objective
2. Key concepts covered
3. Practical exercise
4. Common questions addressed
5. Estimated completion time`,
    variables: [
      { name: "course_topic", description: "Main topic of the course", required: true },
      { name: "target_student", description: "Description of ideal student", required: true },
      { name: "transformation", description: "The transformation students will achieve", required: true },
      { name: "course_length", description: "Estimated course length (hours/weeks)", required: true },
      { name: "audience_questions", description: "Questions and pain points from audience research", required: true },
    ],
    bestPractices: [
      "Start with a quick win in Module 0 to build momentum",
      "Each module should have a clear, measurable outcome",
      "Include action items after each module",
      "Address common questions from your research in relevant lessons",
      "Build in community/support touchpoints",
    ],
    framework: "ADDIE",
  },
];

// ============================================
// AD COPY PROMPTS
// ============================================

export const adCopyPrompts: ContentPrompt[] = [
  {
    id: "ad-facebook-primary",
    contentType: "ad_copy",
    category: "facebook",
    name: "Facebook/Instagram Ad Copy Pack",
    description: "Creates multiple ad variations for Facebook and Instagram",
    promptTemplate: `You are a performance marketer who has managed $50M+ in ad spend. Create a pack of high-converting Facebook/Instagram ad variations.

**PRODUCT/SERVICE:** {{product_name}}
**TARGET AUDIENCE:** {{target_audience}}
**MAIN BENEFIT:** {{main_benefit}}
**PRICE/OFFER:** {{offer}}

**PAIN POINTS FROM RESEARCH:**
{{pain_points}}

**TESTIMONIALS:**
{{testimonials}}

**CREATE 5 AD VARIATIONS:**

### VARIATION 1: PROBLEM-AWARE (Long Form)
**Headline:** [Curiosity-driven, no product mention]
**Primary Text:** (125-150 words)
- Hook with specific pain point
- Agitate with hidden costs
- Introduce solution
- Social proof
- CTA

**CTA Button:** Learn More / Shop Now

### VARIATION 2: TESTIMONIAL-LED (Medium Form)
**Headline:** [Quote from testimonial]
**Primary Text:** (75-100 words)
- Lead with result
- Brief story
- Product mention
- CTA

### VARIATION 3: CURIOSITY/CLICK-BAIT (Short Form)
**Headline:** [Pattern interrupt]
**Primary Text:** (50-75 words)
- Intriguing hook
- Tease the solution
- CTA

### VARIATION 4: DIRECT RESPONSE (Offer-Focused)
**Headline:** [Clear value proposition]
**Primary Text:** (75-100 words)
- Lead with offer
- Key benefits
- Urgency
- CTA

### VARIATION 5: STORY-BASED (Long Form)
**Headline:** [Story hook]
**Primary Text:** (150-200 words)
- Personal story
- Transformation
- Product as hero
- CTA

**FOR EACH VARIATION, INCLUDE:**
- 3 headline options
- Primary text
- Suggested image/video direction
- Target audience segment`,
    variables: [
      { name: "product_name", description: "Product name", required: true },
      { name: "target_audience", description: "Target audience", required: true },
      { name: "main_benefit", description: "Main benefit", required: true },
      { name: "offer", description: "Price or offer details", required: true },
      { name: "pain_points", description: "Pain points from research", required: true },
      { name: "testimonials", description: "Customer testimonials", required: true },
    ],
    bestPractices: [
      "Test multiple angles - problem-aware, solution-aware, testimonial-led",
      "Headlines should create curiosity without clickbait",
      "Include specific numbers and timeframes",
      "Match ad copy to landing page messaging",
    ],
    framework: "AIDA",
  },
  {
    id: "ad-google-search",
    contentType: "ad_copy",
    category: "google",
    name: "Google Search Ad Copy",
    description: "Creates Google responsive search ad copy with multiple headlines and descriptions",
    promptTemplate: `Create Google Responsive Search Ad copy optimized for high CTR and quality score.

**PRODUCT/SERVICE:** {{product_name}}
**TARGET KEYWORDS:** {{keywords}}
**MAIN BENEFIT:** {{main_benefit}}
**UNIQUE SELLING POINT:** {{usp}}

**CREATE:**

### HEADLINES (15 variations, 30 chars max each)
1. [Include keyword]
2. [Benefit-focused]
3. [Urgency/Scarcity]
4. [Social proof]
5. [Question format]
[Continue to 15]

### DESCRIPTIONS (4 variations, 90 chars max each)
1. [Feature + Benefit + CTA]
2. [Problem + Solution + CTA]
3. [Social proof + CTA]
4. [Offer + Urgency + CTA]

### SITELINK EXTENSIONS
- [Relevant page 1]
- [Relevant page 2]
- [Relevant page 3]
- [Relevant page 4]

### CALLOUT EXTENSIONS
- [Benefit 1]
- [Benefit 2]
- [Benefit 3]
- [Benefit 4]`,
    variables: [
      { name: "product_name", description: "Product name", required: true },
      { name: "keywords", description: "Target keywords", required: true },
      { name: "main_benefit", description: "Main benefit", required: true },
      { name: "usp", description: "Unique selling proposition", required: true },
    ],
    bestPractices: [
      "Include target keyword in at least 3 headlines",
      "Use numbers and specifics when possible",
      "Include a clear CTA in descriptions",
      "Test emotional vs. logical appeals",
    ],
    framework: "DIRECT",
  },
];

// ============================================
// SALES PAGE PROMPTS
// ============================================

export const salesPagePrompts: ContentPrompt[] = [
  {
    id: "sales-page-full",
    contentType: "sales_page",
    category: "full_page",
    name: "High-Converting Sales Page",
    description: "Creates a complete long-form sales page optimized for conversions",
    promptTemplate: `You are a conversion copywriter who has written sales pages generating $100M+ in revenue. Create a complete sales page.

**PRODUCT/SERVICE:** {{product_name}}
**PRICE:** {{price}}
**TARGET AUDIENCE:** {{target_audience}}
**MAIN PROMISE:** {{main_promise}}

**PAIN POINTS FROM RESEARCH:**
{{pain_points}}

**TESTIMONIALS:**
{{testimonials}}

**OBJECTIONS:**
{{objections}}

**SALES PAGE STRUCTURE:**

## SECTION 1: HERO
**Headline:** [Big promise + Curiosity]
**Subheadline:** [Specificity + Timeframe]
**Hero Image/Video:** [Suggestion]
**CTA Button:** [Action-oriented]

## SECTION 2: PROBLEM IDENTIFICATION
- Open with the most painful symptom
- Expand to hidden costs
- Show you understand deeply
- Create "this person gets me" feeling

## SECTION 3: FAILED SOLUTIONS
- What they've tried
- Why it didn't work
- The real reason (not their fault)

## SECTION 4: SOLUTION INTRODUCTION
- Your unique mechanism
- Why this is different
- The "aha" moment

## SECTION 5: PRODUCT REVEAL
- What it is
- What's included
- How it works
- Key features → Benefits

## SECTION 6: SOCIAL PROOF
- 5-7 testimonials (varied)
- Case studies with specifics
- Media mentions/logos
- Statistics

## SECTION 7: OFFER STACK
- Core product (Value: $X)
- Bonus 1 (Value: $X)
- Bonus 2 (Value: $X)
- Bonus 3 (Value: $X)
- Total Value: $X
- Your Price: $X

## SECTION 8: GUARANTEE
- Risk reversal
- Specific terms
- Confidence statement

## SECTION 9: FAQ/OBJECTION HANDLING
- Top 5-7 objections as questions
- Clear, confident answers

## SECTION 10: FINAL CTA
- Recap transformation
- Urgency element
- Clear button
- P.S. (recap + scarcity)

**FOR EACH SECTION:**
- Provide complete copy
- Include visual/design suggestions
- Note any dynamic elements`,
    variables: [
      { name: "product_name", description: "Product name", required: true },
      { name: "price", description: "Price point", required: true },
      { name: "target_audience", description: "Target audience", required: true },
      { name: "main_promise", description: "Main promise/transformation", required: true },
      { name: "pain_points", description: "Pain points from research", required: true },
      { name: "testimonials", description: "Customer testimonials", required: true },
      { name: "objections", description: "Common objections", required: true },
    ],
    bestPractices: [
      "The headline is 80% of the battle - test multiple versions",
      "Use the exact language from customer research",
      "Stack proof throughout, not just in one section",
      "Address objections before they think of them",
      "The guarantee should be bold and specific",
      "Include multiple CTAs throughout the page",
    ],
    framework: "PASTOR",
  },
];

// ============================================
// EMAIL SEQUENCE PROMPTS
// ============================================

export const emailSequencePrompts: ContentPrompt[] = [
  {
    id: "email-welcome-sequence",
    contentType: "email_sequence",
    category: "welcome",
    name: "Welcome/Nurture Email Sequence",
    description: "Creates a 5-7 email welcome sequence that builds trust and drives sales",
    promptTemplate: `You are an email marketing expert with 40%+ open rates and 5%+ click rates. Create a welcome sequence.

**PRODUCT/SERVICE:** {{product_name}}
**TARGET AUDIENCE:** {{target_audience}}
**LEAD MAGNET:** {{lead_magnet}}
**MAIN OFFER:** {{main_offer}}

**PAIN POINTS:**
{{pain_points}}

**TESTIMONIALS:**
{{testimonials}}

**EMAIL SEQUENCE:**

### EMAIL 1: WELCOME + DELIVERY (Day 0)
**Subject Lines (3 options):**
1. [Curiosity + Benefit]
2. [Direct + Personal]
3. [Question format]

**Body:**
- Warm welcome
- Deliver the lead magnet
- Set expectations
- One quick win tip
- Soft intro to your story

### EMAIL 2: STORY + VALUE (Day 1)
**Subject Lines (3 options):**

**Body:**
- Your origin story
- The problem you solved
- Value-packed tip
- Build connection

### EMAIL 3: COMMON MISTAKE (Day 2)
**Subject Lines (3 options):**

**Body:**
- The mistake most people make
- Why it doesn't work
- The better approach
- Subtle product mention

### EMAIL 4: CASE STUDY (Day 3)
**Subject Lines (3 options):**

**Body:**
- Customer transformation story
- Specific results
- How they did it
- CTA to learn more

### EMAIL 5: OBJECTION BUSTER (Day 4)
**Subject Lines (3 options):**

**Body:**
- Address top objection
- Reframe the concern
- Proof it's not an issue
- Soft pitch

### EMAIL 6: THE OFFER (Day 5)
**Subject Lines (3 options):**

**Body:**
- Full offer presentation
- Benefits stack
- Social proof
- Clear CTA
- Urgency element

### EMAIL 7: LAST CHANCE (Day 6)
**Subject Lines (3 options):**

**Body:**
- Deadline reminder
- Recap benefits
- Final testimonial
- Strong CTA
- P.S. with urgency

**FOR EACH EMAIL:**
- 3 subject line options
- Preview text
- Full body copy
- CTA button text
- Optimal send time`,
    variables: [
      { name: "product_name", description: "Product name", required: true },
      { name: "target_audience", description: "Target audience", required: true },
      { name: "lead_magnet", description: "What they signed up for", required: true },
      { name: "main_offer", description: "The product you're selling", required: true },
      { name: "pain_points", description: "Pain points from research", required: true },
      { name: "testimonials", description: "Customer testimonials", required: true },
    ],
    bestPractices: [
      "Subject lines are everything - always test",
      "First email should deliver value immediately",
      "Build relationship before pitching",
      "Use story and social proof throughout",
      "Create genuine urgency, not fake scarcity",
    ],
    framework: "SOAP",
  },
];

// ============================================
// PRODUCT IDEAS PROMPTS
// ============================================

export const productIdeasPrompts: ContentPrompt[] = [
  {
    id: "product-ideation",
    contentType: "product_idea",
    category: "ideation",
    name: "Product Ideation from Customer Research",
    description: "Generates product ideas based on 'I wish' comments and pain points",
    promptTemplate: `You are a product strategist who has launched multiple 7-figure products. Analyze customer feedback and generate product ideas.

**NICHE/MARKET:** {{niche}}
**EXISTING PRODUCTS:** {{existing_products}}

**"I WISH" COMMENTS:**
{{wish_comments}}

**PAIN POINTS:**
{{pain_points}}

**PRODUCT REQUESTS:**
{{product_requests}}

**GENERATE:**

## PRODUCT IDEA 1: [NAME]
**Type:** [Digital/Physical/Service/Software]
**One-Line Description:** 
**Problem It Solves:**
**Target Customer:**
**Key Features:**
1. [Feature → Benefit]
2. [Feature → Benefit]
3. [Feature → Benefit]

**Pricing Strategy:**
- Suggested price point
- Pricing rationale
- Comparison to alternatives

**MVP Version:**
- Minimum features to launch
- Estimated development time
- Launch strategy

**Market Validation:**
- Evidence from research
- Demand indicators
- Competition analysis

**Revenue Potential:**
- Market size estimate
- Realistic first-year target
- Growth opportunities

[Repeat for 3-5 product ideas]

## RECOMMENDATION
**Best Opportunity:** [Which idea and why]
**Quick Win:** [Fastest to market]
**Biggest Potential:** [Highest ceiling]`,
    variables: [
      { name: "niche", description: "The niche or market", required: true },
      { name: "existing_products", description: "Products already in market", required: true },
      { name: "wish_comments", description: "'I wish' comments from research", required: true },
      { name: "pain_points", description: "Pain points identified", required: true },
      { name: "product_requests", description: "Direct product requests", required: true },
    ],
    bestPractices: [
      "Look for patterns in multiple comments",
      "Validate demand before building",
      "Start with MVP, iterate based on feedback",
      "Consider your unique ability to deliver",
    ],
    framework: "LEAN",
  },
];

// ============================================
// COPYWRITING FRAMEWORKS
// ============================================

export const copywritingFrameworks = [
  {
    acronym: "AIDA",
    name: "Attention, Interest, Desire, Action",
    description: "Classic framework for guiding prospects through the buying journey",
    steps: [
      {
        letter: "A",
        name: "Attention",
        description: "Grab attention with a bold headline or hook",
        promptGuidance: "Use pattern interrupts, surprising statistics, or provocative questions",
        examples: ["Did you know 97% of diets fail?", "Warning: Your morning routine is sabotaging your success"],
      },
      {
        letter: "I",
        name: "Interest",
        description: "Build interest by addressing their problem",
        promptGuidance: "Show you understand their pain deeply, use their exact language",
        examples: ["If you've tried everything and nothing works...", "You're not lazy. You're not broken."],
      },
      {
        letter: "D",
        name: "Desire",
        description: "Create desire by showing the transformation",
        promptGuidance: "Paint the 'after' picture vividly, use testimonials and proof",
        examples: ["Imagine waking up with energy...", "Sarah lost 30 lbs in 90 days without..."],
      },
      {
        letter: "A",
        name: "Action",
        description: "Drive action with a clear CTA",
        promptGuidance: "Make the next step obvious, reduce friction, add urgency",
        examples: ["Click below to get started", "Join 10,000+ others who..."],
      },
    ],
    bestFor: ["sales_pages", "email", "ads", "landing_pages"],
  },
  {
    acronym: "PAS",
    name: "Problem, Agitate, Solution",
    description: "Powerful framework for problem-aware audiences",
    steps: [
      {
        letter: "P",
        name: "Problem",
        description: "Identify the problem clearly",
        promptGuidance: "Be specific about the pain, use customer language",
        examples: ["Struggling to get quality sleep?", "Tired of yo-yo dieting?"],
      },
      {
        letter: "A",
        name: "Agitate",
        description: "Agitate by exploring consequences",
        promptGuidance: "Show hidden costs, emotional toll, what happens if nothing changes",
        examples: ["Poor sleep affects everything...", "Every failed diet chips away at your confidence..."],
      },
      {
        letter: "S",
        name: "Solution",
        description: "Present your solution",
        promptGuidance: "Position as the answer, explain why it works, prove it",
        examples: ["That's why we created...", "Finally, a method that addresses the root cause..."],
      },
    ],
    bestFor: ["advertorials", "email", "ads", "vsl"],
  },
  {
    acronym: "BAB",
    name: "Before, After, Bridge",
    description: "Simple transformation-focused framework",
    steps: [
      {
        letter: "B",
        name: "Before",
        description: "Describe their current painful state",
        promptGuidance: "Be vivid and specific about current struggles",
        examples: ["Right now, you're probably...", "You wake up exhausted..."],
      },
      {
        letter: "A",
        name: "After",
        description: "Paint the desired future state",
        promptGuidance: "Make it tangible and emotional",
        examples: ["Imagine instead...", "Picture yourself 90 days from now..."],
      },
      {
        letter: "B",
        name: "Bridge",
        description: "Your product is the bridge",
        promptGuidance: "Show how your solution gets them from before to after",
        examples: ["[Product] is the bridge...", "Here's how to get there..."],
      },
    ],
    bestFor: ["email", "social_posts", "short_ads"],
  },
  {
    acronym: "4Ps",
    name: "Promise, Picture, Proof, Push",
    description: "Direct response framework for high-converting copy",
    steps: [
      {
        letter: "P",
        name: "Promise",
        description: "Make a bold, specific promise",
        promptGuidance: "Be specific about the outcome and timeframe",
        examples: ["Lose 10 lbs in 30 days", "Double your email list in 60 days"],
      },
      {
        letter: "P",
        name: "Picture",
        description: "Paint a vivid picture of success",
        promptGuidance: "Use sensory language, make it real",
        examples: ["Imagine looking in the mirror and...", "Picture opening your inbox to..."],
      },
      {
        letter: "P",
        name: "Proof",
        description: "Provide undeniable proof",
        promptGuidance: "Stack testimonials, statistics, credentials",
        examples: ["10,000+ customers", "Featured in Forbes", "92% success rate"],
      },
      {
        letter: "P",
        name: "Push",
        description: "Push them to take action",
        promptGuidance: "Create urgency, remove risk, make it easy",
        examples: ["Limited spots available", "100% money-back guarantee", "Start in 2 minutes"],
      },
    ],
    bestFor: ["sales_pages", "vsl", "webinars"],
  },
  {
    acronym: "PASTOR",
    name: "Problem, Amplify, Story, Transformation, Offer, Response",
    description: "Comprehensive framework for long-form sales copy",
    steps: [
      {
        letter: "P",
        name: "Problem",
        description: "Identify the problem",
        promptGuidance: "Be specific and use customer language",
        examples: [],
      },
      {
        letter: "A",
        name: "Amplify",
        description: "Amplify the consequences",
        promptGuidance: "Show what happens if they don't solve it",
        examples: [],
      },
      {
        letter: "S",
        name: "Story",
        description: "Tell a relatable story",
        promptGuidance: "Use your story or customer story",
        examples: [],
      },
      {
        letter: "T",
        name: "Transformation",
        description: "Show the transformation",
        promptGuidance: "Specific results with proof",
        examples: [],
      },
      {
        letter: "O",
        name: "Offer",
        description: "Present the offer",
        promptGuidance: "Stack value, show what they get",
        examples: [],
      },
      {
        letter: "R",
        name: "Response",
        description: "Call for response",
        promptGuidance: "Clear CTA with urgency",
        examples: [],
      },
    ],
    bestFor: ["sales_pages", "vsl", "webinars", "long_form_ads"],
  },
];

// ============================================
// CRO BEST PRACTICES
// ============================================

export const croBestPractices = [
  {
    contentType: "all",
    section: "headline",
    title: "Headline Optimization",
    description: "Headlines account for 80% of your copy's effectiveness",
    doList: [
      "Include a specific benefit or outcome",
      "Use numbers when possible (odd numbers perform better)",
      "Create curiosity without clickbait",
      "Address the reader directly with 'you'",
      "Test multiple variations",
    ],
    dontList: [
      "Be vague or generic",
      "Use jargon or industry terms",
      "Make claims you can't prove",
      "Write headlines longer than 10 words",
      "Bury the benefit",
    ],
    benchmarks: [
      { metric: "Headline CTR", target: "3-5%", industry: "General" },
    ],
    priority: "critical",
    impactScore: 95,
  },
  {
    contentType: "all",
    section: "cta",
    title: "Call-to-Action Optimization",
    description: "CTAs are the conversion point - optimize ruthlessly",
    doList: [
      "Use action verbs (Get, Start, Join, Discover)",
      "Create urgency without being pushy",
      "Make the button stand out visually",
      "Reduce friction with clear next steps",
      "Test button color, size, and copy",
    ],
    dontList: [
      "Use 'Submit' or 'Click Here'",
      "Have multiple competing CTAs",
      "Hide the CTA below the fold",
      "Make users think about what happens next",
    ],
    benchmarks: [
      { metric: "Button CTR", target: "2-5%", industry: "E-commerce" },
      { metric: "Form completion", target: "40-60%", industry: "Lead gen" },
    ],
    priority: "critical",
    impactScore: 90,
  },
  {
    contentType: "sales_page",
    section: "social_proof",
    title: "Social Proof Placement",
    description: "Strategic placement of testimonials and proof elements",
    doList: [
      "Place testimonials near CTAs",
      "Use specific results with numbers",
      "Include photos and full names when possible",
      "Vary testimonial formats (video, text, case study)",
      "Address different objections with different testimonials",
    ],
    dontList: [
      "Use fake or generic testimonials",
      "Cluster all proof in one section",
      "Use testimonials without specifics",
      "Ignore negative reviews (address them)",
    ],
    benchmarks: [
      { metric: "Conversion lift", target: "15-30%", industry: "With testimonials vs without" },
    ],
    priority: "high",
    impactScore: 75,
  },
  {
    contentType: "email",
    section: "subject_line",
    title: "Email Subject Line Optimization",
    description: "Subject lines determine if your email gets opened",
    doList: [
      "Keep under 50 characters",
      "Create curiosity or urgency",
      "Personalize when possible",
      "Test emojis (sparingly)",
      "A/B test every send",
    ],
    dontList: [
      "Use ALL CAPS",
      "Use spam trigger words",
      "Be misleading about content",
      "Use the same format every time",
    ],
    benchmarks: [
      { metric: "Open rate", target: "20-30%", industry: "Marketing emails" },
      { metric: "Open rate", target: "40-60%", industry: "Transactional" },
    ],
    priority: "critical",
    impactScore: 85,
  },
];

// Export all prompts
export const allPrompts = {
  advertorial: advertorialPrompts,
  vsl_script: vslScriptPrompts,
  ugc_scenario: ugcScenarioPrompts,
  course_outline: courseOutlinePrompts,
  ad_copy: adCopyPrompts,
  sales_page: salesPagePrompts,
  email_sequence: emailSequencePrompts,
  product_idea: productIdeasPrompts,
};

export const getPromptsForType = (contentType: string): ContentPrompt[] => {
  return allPrompts[contentType as keyof typeof allPrompts] || [];
};

export const getPromptById = (id: string): ContentPrompt | undefined => {
  for (const prompts of Object.values(allPrompts)) {
    const found = prompts.find(p => p.id === id);
    if (found) return found;
  }
  return undefined;
};
