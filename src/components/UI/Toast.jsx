import { useGigs } from '../../context/GigContext';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import './Toast.css';

const Toast = () => {
  const { toasts, dismissToast } = useGigs();

  if (toasts.length === 0) return null;

  const iconMap = {
    success: <CheckCircle size={16} />,
    error: <AlertCircle size={16} />,
    info: <Info size={16} />,
  };

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`} onClick={() => dismissToast(toast.id)}>
          {iconMap[toast.type]}
          <span>{toast.message}</span>
          <X size={14} className="toast-close" />
        </div>
      ))}
    </div>
  );
};

export default Toast;
