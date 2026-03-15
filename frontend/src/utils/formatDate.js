import { format, isToday, isYesterday } from 'date-fns';

export function formatMessageTimestamp(value) {
  if (!value) return '';
  
  let date;
  if (Array.isArray(value)) {
    // Handle Jackson array format [YYYY, MM, DD, HH, mm, ss]
    date = new Date(value[0], value[1] - 1, value[2], value[3], value[4], value[5]);
  } else {
    date = new Date(value);
  }

  if (isNaN(date.getTime())) {
    return '';
  }

  if (isToday(date)) {
    return format(date, 'h:mm a');
  }
  if (isYesterday(date)) {
    return `Yesterday ${format(date, 'h:mm a')}`;
  }
  return format(date, 'MMM d, h:mm a');
}
