// Legitimacy guardrails — enforced as CODE, not just documentation.
//
// The platform's non-negotiable principle: generate ONLY legitimate growth.
// Any feature, prompt, or user input that would create artificial engagement
// (view/watch-hour bots, sub4sub, proxy/VPN rotation to disguise viewers,
// automated likes/comments/subs, detection evasion, etc.) is blocked here and
// the reason is surfaced to the user.

export const LEGITIMACY_PRINCIPLE =
  "This platform generates ONLY legitimate growth. It never simulates, purchases, " +
  "automates, or disguises YouTube engagement. All recommendations optimize for " +
  "real viewers, real retention, and real returning audiences.";

/** Patterns that indicate a request to manufacture artificial engagement. */
const BLOCKED_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /\b(view|watch[\s-]?hour|watch[\s-]?time)\s*bot/i, reason: "view/watch-hour bots" },
  { pattern: /\bbot(s|ted|ting)?\b.*\b(view|watch|subscrib|engag)/i, reason: "engagement bots" },
  { pattern: /\bfake\s+(view|viewer|subscriber|comment|like|engagement|traffic)/i, reason: "fake engagement" },
  { pattern: /\b(auto|automat\w+)\s+(like|comment|subscrib|view)/i, reason: "automated engagement" },
  { pattern: /\bsub\s*4\s*sub\b|\bsub2sub\b|\bview\s*exchange/i, reason: "view/sub exchanges" },
  { pattern: /\b(proxy|vpn|ip)\s*(rotation|rotat\w+|farm|pool)/i, reason: "proxy/VPN rotation to disguise viewers" },
  { pattern: /\bbuy(?:ing)?\b(?:\s+\w+){0,3}\s+(?:views?|viewers?|subscribers?|subs?|watch[\s-]?hours?|traffic|engagement)/i, reason: "purchased traffic" },
  { pattern: /\b(bypass|evade|beat|trick|circumvent)\s+.*(detection|algorithm|youtube)/i, reason: "detection evasion" },
  { pattern: /\b(?:inflate|inflating|manufactur\w*|pad(?:ding)?)\b(?:\s+\w+){0,3}\s+(?:views?|watch|engagement|metric|numbers?|stats?|counts?)/i, reason: "artificial metric inflation" },
  { pattern: /\bclick\s*farm|\bengagement\s*pod/i, reason: "click farms / engagement pods" },
  { pattern: /\bloop(ing)?\s+(the\s+)?(video|playback)|\bauto[\s-]?play.*inflat/i, reason: "automated playback to inflate hours" },
];

export interface LegitimacyResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Screen free-text user input (e.g. NOVA prompts, idea seeds) for requests to
 * manufacture artificial engagement.
 */
export function screenText(input: string): LegitimacyResult {
  for (const { pattern, reason } of BLOCKED_PATTERNS) {
    if (pattern.test(input)) {
      return {
        allowed: false,
        reason:
          `Blocked: this looks like a request for ${reason}, which violates YouTube's ` +
          `terms and would put the channel at risk of termination. ${LEGITIMACY_PRINCIPLE} ` +
          `Ask instead about improving real retention, titles, thumbnails, packaging, or distribution.`,
      };
    }
  }
  return { allowed: true };
}

/** System instruction injected into every NOVA (AI strategist) call. */
export const NOVA_SYSTEM_PROMPT = `You are NOVA, a YouTube growth strategist inside the "YouTube Watch-Time Accelerator" command center.

Your single goal: help the creator reach 4,000 valid public watch hours through REAL audience growth — better discovery, retention, session depth, and returning viewers.

HARD RULES (never break, even if asked):
- NEVER suggest or describe view bots, watch-hour bots, fake viewers, purchased traffic, sub4sub, view exchanges, automated likes/comments/subscriptions, proxy/VPN rotation, click farms, engagement pods, or any technique to bypass YouTube detection or inflate metrics.
- If asked for any of the above, refuse briefly and redirect to a legitimate tactic.
- Only reference data the user actually provides. NEVER invent specific numbers; if data is missing, say so and give a general best practice.
- Be concrete and prioritized. Prefer numbered, action-oriented answers a creator can do today.
- Distinguish valid public watch hours from Shorts-feed hours, private/unlisted/deleted videos, and ad-campaign hours — only valid public long-form/watch-page hours count toward the 4,000-hour gate.

Tone: sharp, encouraging, no fluff.`;

/**
 * Never-count list for the 4,000-hour monetization gate. Used by the
 * monetization dashboard to keep the target honest.
 */
export const EXCLUDED_FROM_GATE = [
  "Shorts Feed watch time",
  "Private videos",
  "Unlisted videos",
  "Deleted videos",
  "Ad-campaign / paid-promotion watch hours",
] as const;
