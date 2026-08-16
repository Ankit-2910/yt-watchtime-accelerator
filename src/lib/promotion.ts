// External Promotion Intelligence (spec §22).
// Generates LEGITIMATE, platform-specific distribution copy for a video.
// It never spams, mass-comments, or uses fake accounts — each output includes a
// best-practice note reinforcing genuine, non-spammy sharing.

export type PromoPlatform =
  | "Facebook"
  | "Instagram"
  | "WhatsApp"
  | "Telegram"
  | "Reddit"
  | "X"
  | "LinkedIn"
  | "Website"
  | "Blog"
  | "Email";

export const PROMO_PLATFORMS: PromoPlatform[] = [
  "Facebook",
  "Instagram",
  "WhatsApp",
  "Telegram",
  "Reddit",
  "X",
  "LinkedIn",
  "Website",
  "Blog",
  "Email",
];

export interface PromoInput {
  title: string;
  url: string;
  topic?: string;
  hook?: string;
  channelTitle?: string;
}

export interface PromoResult {
  platform: PromoPlatform;
  copy: string;
  note: string;
  charCount: number;
}

function hashtagsFor(topic: string, n: number): string {
  const base = topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => `#${w}`);
  const generic = ["#history", "#documentary", "#youtube", "#learnonyoutube", "#creator"];
  return [...base, ...generic].slice(0, n).join(" ");
}

const GENERATORS: Record<PromoPlatform, (i: PromoInput) => Omit<PromoResult, "platform" | "charCount">> = {
  Facebook: (i) => ({
    copy: `${i.hook ?? `New video: ${i.title}`}\n\nI just published a deep dive on ${i.topic ?? i.title}. If you enjoy this kind of story, I'd love to hear your take in the comments.\n\n▶ ${i.url}\n\n${hashtagsFor(i.topic ?? i.title, 3)}`,
    note: "Post natively and reply to every comment in the first hour — engagement early signals reach. Don't post the same link to dozens of groups.",
  }),
  Instagram: (i) => ({
    copy: `${i.hook ?? i.title} ✨\n\n${i.topic ?? "The full story"} — new on the channel. Link in bio.\n\n.\n.\n${hashtagsFor(i.topic ?? i.title, 8)}`,
    note: "IG hides reach when captions contain outbound links or 'link in YouTube'. Keep the link in bio and post a teaser Reel that points to the full video.",
  }),
  WhatsApp: (i) => ({
    copy: `Hey! I just released "${i.title}" 🎬\nThought you might enjoy it: ${i.url}\nNo pressure — would love your honest feedback if you get a minute.`,
    note: "Send only to people who'd genuinely care, individually or to your own broadcast list. Never mass-forward to strangers.",
  }),
  Telegram: (i) => ({
    copy: `📢 New video: ${i.title}\n\n${i.hook ?? `A full breakdown of ${i.topic ?? i.title}.`}\n\nWatch → ${i.url}`,
    note: "Share in your own channel or relevant communities where self-promo is allowed. Read each group's rules first.",
  }),
  Reddit: (i) => ({
    copy: `${i.title}\n\n${i.hook ?? `I made a video exploring ${i.topic ?? i.title}.`} I tried to focus on the parts most people get wrong. Happy to answer questions in the comments.\n\n${i.url}`,
    note: "Only post to subreddits that allow creator content, follow the 9:1 rule (contribute far more than you promote), and actually engage — Reddit punishes drive-by link drops.",
  }),
  X: (i) => {
    const tags = hashtagsFor(i.topic ?? i.title, 2);
    let copy = `${i.hook ?? i.title}\n\n${i.url} ${tags}`;
    if (copy.length > 280) copy = `${(i.hook ?? i.title).slice(0, 200)}\n\n${i.url}`;
    return {
      copy,
      note: "Lead with the hook, not the link. Consider a short thread: hook → 2-3 insights → link on the last post.",
    };
  },
  LinkedIn: (i) => ({
    copy: `I just published: ${i.title}\n\n${i.hook ?? `Here's what I learned making a deep dive on ${i.topic ?? i.title}:`}\n\n• A surprising detail most overlook\n• Why it still matters today\n• The part that changed how I see it\n\nFull video (${Math.max(8, 12)} min): ${i.url}\n\nWhat would you add?`,
    note: "Write for professionals — frame it as insight, not just 'watch my video'. Ask a question to invite genuine discussion.",
  }),
  Website: (i) => ({
    copy: `<section class="featured-video">\n  <h2>${i.title}</h2>\n  <p>${i.hook ?? `Watch our latest deep dive on ${i.topic ?? i.title}.`}</p>\n  <a class="btn" href="${i.url}" target="_blank" rel="noopener">Watch on YouTube ▶</a>\n</section>`,
    note: "Embed the player above the fold on a relevant page. An embedded watch on your own site still counts as legitimate watch time.",
  }),
  Blog: (i) => ({
    copy: `# ${i.title}\n\n${i.hook ?? `In this video I break down ${i.topic ?? i.title}.`}\n\nBelow is a short written companion, then the full video.\n\n## Key points\n1. …\n2. …\n3. …\n\n<!-- Embed the YouTube player here -->\n\n[Watch the full video](${i.url})`,
    note: "A written companion post earns Google search traffic that funnels to the video for months — evergreen, legitimate discovery.",
  }),
  Email: (i) => ({
    copy: `Subject: ${i.hook ?? i.title}\n\nHi {{first_name}},\n\nI just published "${i.title}" — ${i.topic ? `a full look at ${i.topic}` : "my latest deep dive"}.\n\nWatch it here: ${i.url}\n\nIf you enjoy it, a comment on YouTube really helps the video find more viewers.\n\nThanks for being here,\n${i.channelTitle ?? "The channel"}`,
    note: "Email your own opted-in subscribers only. One clear link, personal tone — this is your highest-intent, most legitimate audience.",
  }),
};

export function generatePromotion(
  input: PromoInput,
  platforms: PromoPlatform[] = PROMO_PLATFORMS
): PromoResult[] {
  return platforms.map((platform) => {
    const { copy, note } = GENERATORS[platform](input);
    return { platform, copy, note, charCount: copy.length };
  });
}
