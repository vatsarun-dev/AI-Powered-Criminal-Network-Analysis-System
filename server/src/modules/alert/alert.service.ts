import { AlertModel } from "../../models/alert.model.js";
import { NotFoundError } from "../../shared/error/globalError.js";
import type { AlertResponse, AlertStatus } from "../../types/alert.js";

type AlertDocument = {
  _id: unknown;
  ruleId: unknown;
  entityId: unknown;
  caseId: string;
  message: string;
  status: AlertStatus;
  triggeredAt: Date;
};

export default class AlertService {
  private response(alert: AlertDocument): AlertResponse {
    return {
      alertId: String(alert._id),
      ruleId: String(alert.ruleId),
      entityId: String(alert.entityId),
      caseId: alert.caseId,
      message: alert.message,
      status: alert.status,
      triggeredAt: alert.triggeredAt,
    };
  }

  async listAlerts(caseId?: string, status?: AlertStatus): Promise<AlertResponse[]> {
    const query: Record<string, unknown> = {};
    if (caseId) query.caseId = caseId;
    if (status) query.status = status;

    const alerts = await AlertModel.find(query).sort({ triggeredAt: -1 });
    return alerts.map((alert) => this.response(alert as unknown as AlertDocument));
  }

  async updateStatus(alertId: string, status: AlertStatus): Promise<AlertResponse> {
    const alert = await AlertModel.findByIdAndUpdate(
      alertId,
      { status },
      { new: true },
    );

    if (!alert) {
      throw new NotFoundError("Alert not found");
    }

    return this.response(alert as unknown as AlertDocument);
  }
}