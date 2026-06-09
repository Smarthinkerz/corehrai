import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Check, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import type { Notification } from '@shared/schema';

const TYPE_CONFIG: Record<string, { icon: typeof Info; color: string }> = {
  info: { icon: Info, color: 'text-blue-500' },
  success: { icon: CheckCircle, color: 'text-green-500' },
  warning: { icon: AlertTriangle, color: 'text-amber-500' },
  error: { icon: XCircle, color: 'text-red-500' },
};

const NotificationCenter = () => {
  const { data: rawNotifications } = useQuery<any>({
    queryKey: ['/api/notifications'],
    refetchInterval: 30000,
  });
  const notifications: Notification[] = Array.isArray(rawNotifications) ? rawNotifications : (rawNotifications?.data || []);

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread-count'],
    refetchInterval: 15000,
  });

  const unreadCount = unreadData?.count || 0;

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('PATCH', `/api/notifications/${id}/read`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/notifications/mark-all-read', {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/notifications/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="relative p-1 rounded-full text-neutral-600 hover:bg-neutral-100 focus:outline-none">
          <span className="sr-only">View notifications</span>
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7"
              onClick={() => markAllReadMutation.mutate()}
            >
              <CheckCheck className="h-3 w-3 mr-1" />Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-neutral-400">
              No notifications yet
            </div>
          ) : (
            <div>
              {notifications.slice(0, 20).map((notification) => {
                const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info;
                const Icon = config.icon;
                return (
                  <div
                    key={notification.id}
                    className={`flex gap-3 px-4 py-3 border-b last:border-0 hover:bg-neutral-50 transition-colors ${
                      !notification.isRead ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="mt-0.5">
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.isRead ? 'font-medium' : 'text-neutral-700'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-neutral-400 mt-1">{timeAgo(notification.createdAt as unknown as string)}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {!notification.isRead && (
                        <button
                          onClick={() => markReadMutation.mutate(notification.id)}
                          className="p-1 rounded hover:bg-neutral-200 text-neutral-400 hover:text-neutral-600"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteMutation.mutate(notification.id)}
                        className="p-1 rounded hover:bg-red-100 text-neutral-400 hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationCenter;
