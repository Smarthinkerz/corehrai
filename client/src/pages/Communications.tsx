import usePageTitle from "@/hooks/usePageTitle";
import AnnouncementManager from '@/components/communications/AnnouncementManager';

const Communications = () => {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <AnnouncementManager />
    </div>
  );
};

export default Communications;
