// Shared domain types for the YouTube Watch-Time Accelerator.

export type VideoFormat = "long" | "short";

export type CalendarStatus =
  | "IDEA"
  | "SCRIPT"
  | "RECORDING"
  | "EDITING"
  | "READY"
  | "PUBLISHED"
  | "ANALYZING";

export interface VideoStats {
  views: number;
  likes: number;
  comments: number;
  /** seconds */
  avgViewDuration: number;
  /** 0-100 */
  avgPercentageViewed: number;
  /** cumulative valid public watch hours */
  watchHours: number;
  /** 0-100 */
  ctr: number;
  subscribersGained: number;
  newViewers: number;
  returningViewers: number;
}

export interface RetentionBucket {
  label: string;
  /** 0-100 percentage of viewers still watching */
  retention: number;
}

/** A point on the real (per-percent) audience-retention curve from YouTube Analytics. */
export interface RealRetentionPoint {
  /** elapsed position through the video, 0-100 (%) */
  ratio: number;
  /** audience still watching at this point, 0-100+ (%); can exceed 100 on rewatched segments */
  watchRatio: number;
  /** relative retention performance vs similar-length videos, 0-1 (or null) */
  relative: number | null;
}

export interface Video {
  id: string;
  ytVideoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  url: string;
  durationSec: number;
  publishedAt: string; // ISO
  format: VideoFormat;
  playlist?: string;
  notes?: string;
  stats: VideoStats;
  retentionCurve: RetentionBucket[];
  ageDays: number;
}

export interface TimePoint {
  date: string; // ISO (yyyy-mm-dd)
  watchHours: number;
  shortsFeedHours: number;
  views: number;
  subscribers: number;
}

export interface ChannelSnapshot {
  id: string;
  title: string;
  handle: string;
  thumbnailUrl: string;
  subscribers: number;
  totalViews: number;
  /** valid public watch hours accumulated toward the gate */
  currentWatchHours: number;
  targetWatchHours: number;
  /** average view duration across channel, seconds */
  avgViewDuration: number;
  /** 0-100 */
  avgRetention: number;
  /** 0-100 */
  ctr: number;
  returningViewerRate: number; // 0-100
  videos: Video[];
  timeline: TimePoint[];
  isDemo: boolean;
}

export interface RoadmapScenario {
  name: "Conservative" | "Realistic" | "Aggressive";
  hoursPerDay: number;
  daysRemaining: number;
  completionDate: string; // ISO
}

export interface Action {
  title: string;
  detail: string;
  impact: number; // 0-100
  effort: number; // 0-100 (higher = more effort)
  confidence: number; // 0-100
}

export interface ChannelScoreComponent {
  label: string;
  score: number; // 0-100
}

export interface ChannelScore {
  overall: number;
  components: ChannelScoreComponent[];
}

export interface AiMessage {
  role: "user" | "assistant";
  content: string;
}
