import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

// Sample data for the charts
const departmentData = [
  { department: "Engineering", stressLevel: 6.2, workLifeBalance: 7.1, satisfaction: 7.8, energyLevel: 6.9 },
  { department: "Marketing", stressLevel: 5.8, workLifeBalance: 7.5, satisfaction: 8.1, energyLevel: 7.2 },
  { department: "Sales", stressLevel: 6.5, workLifeBalance: 6.8, satisfaction: 7.5, energyLevel: 7.0 },
  { department: "HR", stressLevel: 5.2, workLifeBalance: 8.0, satisfaction: 8.3, energyLevel: 7.5 },
  { department: "Finance", stressLevel: 7.1, workLifeBalance: 6.5, satisfaction: 7.0, energyLevel: 6.4 },
  { department: "Product", stressLevel: 6.0, workLifeBalance: 7.3, satisfaction: 7.9, energyLevel: 7.1 },
  { department: "Design", stressLevel: 5.5, workLifeBalance: 7.7, satisfaction: 8.2, energyLevel: 7.4 },
  { department: "Customer Support", stressLevel: 6.8, workLifeBalance: 6.7, satisfaction: 7.3, energyLevel: 6.8 }
];

const trendData = [
  { month: "Jan", avgStressLevel: 6.8, avgWorkLifeBalance: 6.5, avgSatisfaction: 7.0, avgEnergyLevel: 6.7, physicalActivity: 120 },
  { month: "Feb", avgStressLevel: 6.7, avgWorkLifeBalance: 6.6, avgSatisfaction: 7.1, avgEnergyLevel: 6.8, physicalActivity: 125 },
  { month: "Mar", avgStressLevel: 6.5, avgWorkLifeBalance: 6.8, avgSatisfaction: 7.3, avgEnergyLevel: 7.0, physicalActivity: 130 },
  { month: "Apr", avgStressLevel: 6.3, avgWorkLifeBalance: 7.0, avgSatisfaction: 7.5, avgEnergyLevel: 7.1, physicalActivity: 140 },
  { month: "May", avgStressLevel: 6.0, avgWorkLifeBalance: 7.2, avgSatisfaction: 7.7, avgEnergyLevel: 7.3, physicalActivity: 150 },
  { month: "Jun", avgStressLevel: 5.8, avgWorkLifeBalance: 7.3, avgSatisfaction: 7.8, avgEnergyLevel: 7.4, physicalActivity: 155 },
  { month: "Jul", avgStressLevel: 5.7, avgWorkLifeBalance: 7.4, avgSatisfaction: 7.9, avgEnergyLevel: 7.5, physicalActivity: 160 },
  { month: "Aug", avgStressLevel: 5.9, avgWorkLifeBalance: 7.3, avgSatisfaction: 7.8, avgEnergyLevel: 7.4, physicalActivity: 155 },
  { month: "Sep", avgStressLevel: 6.1, avgWorkLifeBalance: 7.2, avgSatisfaction: 7.7, avgEnergyLevel: 7.3, physicalActivity: 150 },
  { month: "Oct", avgStressLevel: 6.3, avgWorkLifeBalance: 7.1, avgSatisfaction: 7.6, avgEnergyLevel: 7.2, physicalActivity: 145 },
  { month: "Nov", avgStressLevel: 6.5, avgWorkLifeBalance: 6.9, avgSatisfaction: 7.4, avgEnergyLevel: 7.0, physicalActivity: 135 },
  { month: "Dec", avgStressLevel: 6.6, avgWorkLifeBalance: 6.7, avgSatisfaction: 7.2, avgEnergyLevel: 6.8, physicalActivity: 130 }
];

// Convert from CamelCase to Human Readable format
const formatMetricName = (metric: string) => {
  switch (metric) {
    case "stressLevel": return "Stress Level";
    case "workLifeBalance": return "Work-Life Balance";
    case "satisfaction": return "Satisfaction";
    case "energyLevel": return "Energy Level";
    case "physicalActivity": return "Physical Activity (min/week)";
    case "avgStressLevel": return "Avg. Stress Level";
    case "avgWorkLifeBalance": return "Avg. Work-Life Balance";
    case "avgSatisfaction": return "Avg. Satisfaction";
    case "avgEnergyLevel": return "Avg. Energy Level";
    default: return metric;
  }
};

export function WellnessMetrics() {
  const [metricView, setMetricView] = useState("departmental");
  const [selectedMetric, setSelectedMetric] = useState("satisfaction");
  const [timeRange, setTimeRange] = useState("year");

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <Tabs value={metricView} onValueChange={setMetricView} className="w-full max-w-md">
          <TabsList>
            <TabsTrigger value="departmental">Department View</TabsTrigger>
            <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-4">
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="satisfaction">Satisfaction</SelectItem>
              <SelectItem value="stressLevel">Stress Level</SelectItem>
              <SelectItem value="workLifeBalance">Work-Life Balance</SelectItem>
              <SelectItem value="energyLevel">Energy Level</SelectItem>
              {metricView === "trends" && (
                <SelectItem value="physicalActivity">Physical Activity</SelectItem>
              )}
            </SelectContent>
          </Select>
          
          {metricView === "trends" && (
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quarter">Last Quarter</SelectItem>
                <SelectItem value="half">Last 6 Months</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {metricView === "departmental" && (
        <Card>
          <CardHeader>
            <CardTitle>{formatMetricName(selectedMetric)} by Department</CardTitle>
            <CardDescription>
              Compare {formatMetricName(selectedMetric).toLowerCase()} metrics across different departments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departmentData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip formatter={(value) => [value, formatMetricName(selectedMetric)]} />
                  <Legend />
                  <Bar 
                    dataKey={selectedMetric} 
                    fill={
                      selectedMetric === "stressLevel" ? "#ef4444" : // red for stress
                      selectedMetric === "workLifeBalance" ? "#3b82f6" : // blue for work-life
                      selectedMetric === "satisfaction" ? "#22c55e" : // green for satisfaction
                      "#f59e0b" // yellow for energy
                    } 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {metricView === "trends" && (
        <Card>
          <CardHeader>
            <CardTitle>{formatMetricName(selectedMetric)} Trends</CardTitle>
            <CardDescription>
              View how {formatMetricName(selectedMetric).toLowerCase()} has changed over time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={
                    timeRange === "quarter" ? trendData.slice(-3) :
                    timeRange === "half" ? trendData.slice(-6) :
                    trendData
                  }
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis 
                    domain={selectedMetric === "physicalActivity" ? [0, 'auto'] : [0, 10]}
                    label={{ 
                      value: selectedMetric === "physicalActivity" ? "Minutes per Week" : "Score (1-10)", 
                      angle: -90, 
                      position: 'insideLeft' 
                    }}
                  />
                  <Tooltip formatter={(value) => [value, formatMetricName(selectedMetric)]} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={
                      selectedMetric === "stressLevel" ? "avgStressLevel" :
                      selectedMetric === "workLifeBalance" ? "avgWorkLifeBalance" :
                      selectedMetric === "satisfaction" ? "avgSatisfaction" :
                      selectedMetric === "energyLevel" ? "avgEnergyLevel" :
                      selectedMetric // physicalActivity
                    }
                    stroke={
                      selectedMetric === "stressLevel" ? "#ef4444" : // red for stress
                      selectedMetric === "workLifeBalance" ? "#3b82f6" : // blue for work-life
                      selectedMetric === "satisfaction" ? "#22c55e" : // green for satisfaction
                      selectedMetric === "energyLevel" ? "#f59e0b" : // yellow for energy
                      "#8b5cf6" // purple for physical activity
                    }
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Average Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">7.6/10</div>
            <p className="text-sm text-muted-foreground mt-1">↑ 0.3 from last quarter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Stress Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-500">6.2/10</div>
            <p className="text-sm text-muted-foreground mt-1">↓ 0.4 from last quarter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Work-Life Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">7.2/10</div>
            <p className="text-sm text-muted-foreground mt-1">↑ 0.2 from last quarter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Program Participation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-500">68%</div>
            <p className="text-sm text-muted-foreground mt-1">↑ 12% from last quarter</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}