import type { CommunityConfig } from './config';
export type PublicComment = { id: string; nickname: string; body: string; created_at: string };
export type CommunityState = {
  enabled: boolean; config: CommunityConfig; poll: { id: string; total: number; options: { id: string; label: string; count: number }[]; selected: string | null } | null;
  feedback: { total: number; helpful: number; selected: boolean | null };
  comments: PublicComment[]; nextCursor: { created_at: string; id: string } | null;
  requireTurnstile: boolean;
};
export type SubmitAction = 'poll' | 'comment' | 'feedback' | 'question';
export type AdminData = { articles: Record<string, unknown>[]; comments: Record<string, unknown>[]; questions: Record<string, unknown>[]; nextOffset: number | null };
