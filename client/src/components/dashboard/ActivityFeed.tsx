import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Activity {
  id: number;
  userId: number;
  action: string;
  description: string;
  entityType: string;
  entityId: number;
  timestamp: string;
}

const ActivityIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'CREATE':
      return (
        <div className="h-10 w-10 rounded-full bg-success-50 flex items-center justify-center ring-8 ring-white">
          <svg className="h-5 w-5 text-success-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
      );
    case 'UPDATE':
      return (
        <div className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center ring-8 ring-white">
          <svg className="h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      );
    case 'DELETE':
      return (
        <div className="h-10 w-10 rounded-full bg-error-50 flex items-center justify-center ring-8 ring-white">
          <svg className="h-5 w-5 text-error-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="h-10 w-10 rounded-full bg-warning-50 flex items-center justify-center ring-8 ring-white">
          <svg className="h-5 w-5 text-warning-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
  }
};

const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) {
    return `${seconds} seconds ago`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  
  return date.toLocaleDateString();
};

const ActivityFeed = () => {
  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['/api/activities'],
  });

  const displayActivities: Activity[] = (activities as Activity[]) || [];

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-medium text-neutral-900">Recent Activities</h3>
      </CardHeader>
      <CardContent className="px-5 py-4">
        <div className="flow-root">
          <div className="h-[220px] overflow-y-auto pr-1 custom-scrollbar">
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayActivities.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-neutral-500">
                No recent activities to display.
              </div>
            ) : (
              <ul className="-mb-8">
                {displayActivities.map((activity, index) => (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {index < displayActivities.length - 1 && (
                        <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-neutral-200" aria-hidden="true"></span>
                      )}
                      <div className="relative flex items-start space-x-3">
                        <div className="relative">
                          <ActivityIcon type={activity.action} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div>
                            <div className="text-sm font-medium text-neutral-900">
                              {activity.description.split(' ').length > 0 
                                ? activity.description.split(' ')[0] + ' ' + activity.description.split(' ')[1]
                                : activity.action}
                            </div>
                            <p className="mt-0.5 text-sm text-neutral-500">
                              {activity.description}
                            </p>
                          </div>
                          <div className="mt-2 text-sm text-neutral-700">
                            <p>
                              {activity.entityType === 'employee' 
                                ? 'All required documents have been processed and verified.'
                                : activity.entityType === 'compliance'
                                  ? 'Training certificates expire in 12 days. Automated reminders sent.'
                                  : 'AI analysis suggests a strong technical fit (92% match).'}
                            </p>
                          </div>
                          <div className="mt-2 text-xs text-neutral-500">
                            {formatTimeAgo(activity.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
