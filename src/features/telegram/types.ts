export type TelegramConnectSessionStatus = "pending" | "connected" | "expired";

export interface TelegramConnectStartResponse {
  request_id: string;
  state: string;
  deep_link_url: string;
  expires_at: string;
  bot_username: string;
}

export interface TelegramConnectStatusResponse {
  state: string;
  status: TelegramConnectSessionStatus;
  expires_at: string;
  connected_at: string | null;
  telegram_chat_id: string | null;
  telegram_username: string | null;
}

export interface TelegramActiveStatusResponse {
  connected: boolean;
  active_chat_id: string | null;
  bot_username: string;
}
