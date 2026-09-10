
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";

const statusConfig = {
  NEW: {
    label: "NEW",
    icon: <AlertTriangle size={15} />,
  },
  ACKNOWLEDGED: {
    label: "ACKNOWLEDGED",
    icon: <CheckCircle2 size={15} />,
  },
  DISMISSED: {
    label: "DISMISSED",
    icon: <XCircle size={15} />,
  },
};

const AlertItem = ({
  alert,
  onAcknowledge,
  onDismiss,
  updating,
}) => {
  const config =
    statusConfig[alert.status] || statusConfig.NEW;

  const triggeredAt = alert.triggeredAt
    ? new Date(alert.triggeredAt).toLocaleString()
    : "Unknown time";

  return (
    <div
      className={`alert-item alert-${alert.status.toLowerCase()}`}
    >
      <div className="alert-icon">
        {config.icon}
      </div>

      <div className="alert-content">
        <div className="alert-top">
          <span>{config.label}</span>

          <small>
            <Clock3 size={11} />
            {triggeredAt}
          </small>
        </div>

        <h4>{alert.message}</h4>

        <div className="alert-meta">
          <span>CASE: {alert.caseId}</span>
          <span>ENTITY: {alert.entityId}</span>
        </div>

        {alert.status === "NEW" && (
          <div className="alert-actions">
            <button
              type="button"
              onClick={() => onAcknowledge(alert.alertId)}
              disabled={updating}
            >
              {updating ? "Updating..." : "Acknowledge"}
            </button>

            <button
              type="button"
              onClick={() => onDismiss(alert.alertId)}
              disabled={updating}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertItem;

