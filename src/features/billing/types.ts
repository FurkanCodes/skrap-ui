export type BillingPlanKey = "plus" | "pro";

export interface BillingCheckoutResponse {
  transactionId: string;
}

export interface BillingPortalResponse {
  url: string;
}

export interface BillingSubscription {
  user_id: string;
  provider: string;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  provider_price_id: string | null;
  plan_key: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  next_billed_at: string | null;
  cancel_at_period_end: boolean;
  updated_at: string;
}

export interface BillingCurrentResponse {
  subscription: BillingSubscription | null;
}
