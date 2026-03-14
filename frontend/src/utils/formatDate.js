import { format, isToday, isYesterday } from 'date-fns';

export function formatMessageTimestamp(value) {
  const date = new Date(value);
  if (isToday(date)) {
    return format(date, 'h:mm a');
  }
  if (isYesterday(date)) {
    return `Yesterday ${format(date, 'h:mm a')}`;
  }
  return format(date, 'MMM d, h:mm a');
}
