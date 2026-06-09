import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';

interface Position {
  name: string;
  count: number;
  color: string;
}

const RecruitmentOverview: React.FC = () => {
  const { data: candidates, isLoading } = useQuery({
    queryKey: ['/api/candidates'],
  });

  // Pipeline counts and status
  const pipelineStats = [
    {
      stage: "Applications",
      count: 128,
      percentage: 80,
    },
    {
      stage: "Screening",
      count: 64,
      percentage: 40,
    },
    {
      stage: "Interviews",
      count: 32,
      percentage: 20,
    },
    {
      stage: "Offers",
      count: 12,
      percentage: 8,
    },
    {
      stage: "Onboarding",
      count: 5,
      percentage: 4,
    },
    {
      stage: "Completed",
      count: 3,
      percentage: 2,
    },
    {
      stage: "Rejected",
      count: 42,
      percentage: 26,
    },
    {
      stage: "Withdrawn",
      count: 16,
      percentage: 10,
    },
  ];

  // Top positions sample data
  // In a real app, this would be aggregated from the candidates data
  const topPositions: Position[] = [
    {
      name: "Senior Frontend Developer",
      count: 8,
      color: "bg-primary-500",
    },
    {
      name: "Product Manager",
      count: 6,
      color: "bg-secondary-500",
    },
    {
      name: "UX Designer",
      count: 5,
      color: "bg-accent-500",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-5 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-medium text-neutral-900">Recruitment Overview</h3>
          <Link href="/recruitment" className="text-base font-medium text-primary-600 hover:text-primary-500">
            View all
          </Link>
        </div>
      </div>
      <div className="px-6 py-4">
        {/* Pipeline stats with forced scrollbar */}
        <div className="h-[220px] overflow-y-auto custom-scrollbar border border-neutral-200 rounded-md">
          <div className="p-3">
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3, 4].map((index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="h-4 bg-neutral-200 rounded w-24"></div>
                      <div className="h-4 bg-neutral-200 rounded w-12"></div>
                    </div>
                    <div className="w-full bg-neutral-100 rounded-full h-2">
                      <div className="bg-neutral-300 h-2 rounded-full" style={{ width: `${20 * index}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {pipelineStats.map((stat, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-base font-medium text-neutral-900">{stat.stage}</div>
                      <div className="text-base font-medium text-neutral-900">{stat.count}</div>
                    </div>
                    <div className="w-full bg-neutral-100 rounded-full h-2">
                      <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${stat.percentage}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          
            {/* Top hiring positions */}
            <div className="mt-6">
              <h4 className="text-base font-medium text-neutral-500 mb-4">Top Hiring Positions</h4>
              {isLoading ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map((index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-neutral-300 mr-2"></div>
                        <div className="h-4 bg-neutral-200 rounded w-40"></div>
                      </div>
                      <div className="h-4 bg-neutral-200 rounded w-24"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {topPositions.map((position, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full ${position.color} mr-2`}></div>
                        <span className="text-base text-neutral-800">{position.name}</span>
                      </div>
                      <span className="text-base font-medium text-neutral-600">{position.count} candidates</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruitmentOverview;