import usePageTitle from "@/hooks/usePageTitle";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, Users, CheckSquare } from "lucide-react";
import { useState } from "react";

export default function Calendar() {
  usePageTitle("/calendar");
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const { data: events = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/calendar/events'] });

  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => {
      const eventDate = new Date(e.start).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  const prevMonth = () => setSelectedMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setSelectedMonth(new Date(year, month + 1, 1));

  const stats = {
    interviews: events.filter(e => e.type === 'interview').length,
    leaves: events.filter(e => e.type === 'leave').length,
    tasks: events.filter(e => e.type === 'task').length,
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendar</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="p-2 rounded-lg bg-blue-100"><Users className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-sm text-muted-foreground">Interviews</p><p className="text-2xl font-bold">{stats.interviews}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="p-2 rounded-lg bg-green-100"><CalendarDays className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-sm text-muted-foreground">Leave Requests</p><p className="text-2xl font-bold">{stats.leaves}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="p-2 rounded-lg bg-orange-100"><CheckSquare className="h-5 w-5 text-orange-600" /></div>
            <div><p className="text-sm text-muted-foreground">Tasks Due</p><p className="text-2xl font-bold">{stats.tasks}</p></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} className="px-3 py-1 rounded hover:bg-muted">&larr;</button>
            <CardTitle>{monthName}</CardTitle>
            <button onClick={nextMonth} className="px-3 py-1 rounded hover:bg-muted">&rarr;</button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="bg-muted-foreground/10 p-2 text-center text-sm font-medium">{d}</div>
            ))}
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} className="bg-background p-2 min-h-[80px]" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
              return (
                <div key={day} className={`bg-background p-2 min-h-[80px] ${isToday ? 'ring-2 ring-primary ring-inset' : ''}`}>
                  <span className={`text-sm font-medium ${isToday ? 'text-primary' : ''}`}>{day}</span>
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 3).map((e: any) => (
                      <div key={e.id} className="text-xs px-1 py-0.5 rounded truncate" style={{ backgroundColor: e.color + '20', color: e.color }}>
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && <div className="text-xs text-muted-foreground">+{dayEvents.length - 3} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Upcoming Events</CardTitle></CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No upcoming events</p>
          ) : (
            <div className="space-y-3">
              {events.slice(0, 10).map((event: any) => (
                <div key={event.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 rounded-full" style={{ backgroundColor: event.color }} />
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">{new Date(event.start).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge variant={event.status === 'scheduled' || event.status === 'approved' ? 'default' : 'secondary'}>{event.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
