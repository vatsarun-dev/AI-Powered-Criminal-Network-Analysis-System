export type AlertStatus = "NEW" | "ACKNOWLEDGED" | "DISMISSED";

export type Alert = {
  ruleId: string;
  entityId: string;
  caseId: string;
  message: string;
  status: AlertStatus;
  triggeredAt: Date;
};

export type AlertResponse = {
  alertId: string;
  ruleId: string;
  entityId: string;
  caseId: string;
  message: string;
  status: AlertStatus;
  triggeredAt: Date;
};