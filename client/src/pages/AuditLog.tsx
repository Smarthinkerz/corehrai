import usePageTitle from "@/hooks/usePageTitle";
import AuditLogDashboard from '@/components/audit/AuditLogDashboard';

const AuditLog = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <AuditLogDashboard />
    </div>
  );
};

export default AuditLog;
