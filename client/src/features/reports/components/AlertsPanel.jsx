
import { Bell } from "lucide-react";

import AlertItem from "./AlertItem";

const AlertsPanel = ({
  alerts = [],
  onAcknowledge,
  onDismiss,
  updatingAlertId,
}) => {
  return (
    <section className="reports-panel alerts-panel">
      <div className="reports-panel-header">
        <div>
          <span className="reports-eyebrow">
            THREAT MONITOR
          </span>

          <h2>Alerts</h2>
        </div>

        <div className="alert-count">
          <Bell size={15} />
          {alerts.length}
        </div>
      </div>

      <div className="alerts-list">
        {alerts.length === 0 ? (
          <div className="reports-empty">
            <Bell size={20} />
            <span>No active alerts</span>
          </div>
        ) : (
          alerts.map((alert) => (
            <AlertItem
              key={alert.alertId}
              alert={alert}
              onAcknowledge={onAcknowledge}
              onDismiss={onDismiss}
              updating={
                updatingAlertId === alert.alertId
              }
            />
          ))
        )}
      </div>
    </section>
  );
};

export default AlertsPanel;
