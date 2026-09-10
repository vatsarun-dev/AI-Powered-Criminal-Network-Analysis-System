import {
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";

const AlertItem = ({ alert }) => {
  const icons = {
    HIGH: <AlertTriangle size={16} />,
    MEDIUM: <Info size={16} />,
    LOW: <CheckCircle2 size={16} />,
  };

  return (
    <div className={`alert-item alert-${alert.severity.toLowerCase()}`}>
      <div className="alert-icon">
        {icons[alert.severity] || <Info size={16} />}
      </div>

      <div className="alert-content">
        <div className="alert-top">
          <span>{alert.severity}</span>
          <small>{alert.time}</small>
        </div>

        <h4>{alert.title}</h4>

        <p>{alert.description}</p>
      </div>
    </div>
  );
};

export default AlertItem;