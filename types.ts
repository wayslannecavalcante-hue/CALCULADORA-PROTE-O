export interface FunnelStage {
  leads: number;
  appointments: number;
  visits: number;
  sales: number;
}

export interface FunnelData {
  metaConfig: {
    investment: number;
    targetCpl: number;
  };
  realizedInputs: {
    investment: number;
    leads: number;
    appointments: number;
    visits: number;
    sales: number;
    ticketAvg: number;
  };
  // Computed full funnels
  meta: FunnelStage;
  realized: FunnelStage;
}

export interface CalculatedMetrics {
  cpl: { meta: number; realized: number };
  cpa: { meta: number; realized: number };
  cpv: { meta: number; realized: number };
  cac: { meta: number; realized: number };
  roas: { meta: number; realized: number };
  revenue: { meta: number; realized: number };
  conversion: {
    leadToAppt: { meta: number; realized: number };
    apptToVisit: { meta: number; realized: number };
    visitToSale: { meta: number; realized: number };
    overall: { meta: number; realized: number };
  };
}

export interface ActionPlanResponse {
  markdown: string;
}
