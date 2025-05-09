import React, { useState } from 'react';
import { 
  endOfMonth, startOfMonth, startOfWeek, endOfWeek, 
  addDays, format, isSameMonth, isSameDay, addMonths, subMonths, isToday 
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { CalendarEvent } from '../../types/schema';
import Button from '../ui/Button';

interface CalendarMonthViewProps {
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onAddEvent?: (date: Date) => void;
}

const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({ 
  onEventClick, 
  onDateClick,
  onAddEvent
}) => {
  const { state } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  // Get calendar days for the month
  const getCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    let day = calendarStart;
    const days = [];

    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  };

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return state.calendarEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      return isSameDay(eventDate, day);
    });
  };

  // Render cells for the calendar
  const renderCells = () => {
    const days = getCalendarDays();
    const rows = [];
    let cells = [];

    days.forEach((day, i) => {
      const dayFormatted = format(day, 'yyyy-MM-dd');
      const eventsForDay = getEventsForDay(day);
      const isCurrentMonth = isSameMonth(day, currentDate);
      const isSelected = isSameDay(day, selectedDate);
      const isTodayDate = isToday(day);
      
      cells.push(
        <div 
          key={dayFormatted} 
          className={`
            border p-1 h-32 sm:h-40 md:w-32 overflow-auto
            ${isCurrentMonth ? 'bg-white' : 'bg-gray-100 text-gray-400'}
            ${isSelected ? 'border-primary-500' : 'border-gray-200'}
            ${isTodayDate ? 'bg-yellow-50' : ''}
          `}
          onClick={() => {
            setSelectedDate(day);
            if (onDateClick) onDateClick(day);
          }}
        >
          <div className="flex justify-between">
            <span className={`text-sm ${isTodayDate ? 'font-bold bg-primary-100 text-primary-800 rounded-full h-6 w-6 flex items-center justify-center' : ''}`}>
              {format(day, 'd')}
            </span>
            {isCurrentMonth && eventsForDay.length > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary-500 rounded-full">
                {eventsForDay.length}
              </span>
            )}
          </div>
          
          {isCurrentMonth && eventsForDay.length > 0 && (
            <div className="overflow-y-auto max-h-24 mt-1">
              {eventsForDay.map(event => (
                <div 
                  key={event.eventId} 
                  className={`
                    text-xs mb-1 truncate rounded py-1 px-2 cursor-pointer
                    ${event.eventType === 'Hearing' ? 'bg-red-100 text-red-800' : 
                      event.eventType === 'Deadline' ? 'bg-yellow-100 text-yellow-800' : 
                      event.eventType === 'Meeting' ? 'bg-green-100 text-green-800' : 
                      'bg-blue-100 text-blue-800'}
                  `}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onEventClick) onEventClick(event);
                  }}
                >
                  {format(new Date(event.startTime), 'h:mm a')} - {event.title}
                </div>
              ))}
            </div>
          )}
          
          {isCurrentMonth && (
            <div className="mt-1">
              {onAddEvent && (
                <button
                  className="text-xs text-gray-500 hover:text-primary-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddEvent(day);
                  }}
                >
                  + Add Event
                </button>
              )}
            </div>
          )}
        </div>
      );

      if ((i + 1) % 7 === 0) {
        rows.push(
          <div key={`row-${i}`} className="grid grid-cols-7">
            {cells}
          </div>
        );
        cells = [];
      }
    });

    if (cells.length > 0) {
      rows.push(
        <div key={`row-last`} className="grid grid-cols-7">
          {cells}
        </div>
      );
    }

    return rows;
  };

  // Render days of the week header
  const renderDaysOfWeek = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-1">
        {days.map(day => (
          <div key={day} className="text-center font-semibold py-2 border-b">
            {day}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="calendar-month-view">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">{format(currentDate, 'MMMM yyyy')}</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            icon={<ChevronLeft size={16} />}
            onClick={prevMonth}
            aria-label="Previous month"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            icon={<CalendarIcon size={16} />}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<ChevronRight size={16} />}
            onClick={nextMonth}
            aria-label="Next month"
          />
        </div>
      </div>
      
      {renderDaysOfWeek()}
      <div className="border-l border-t">
        {renderCells()}
      </div>
    </div>
  );
};

export default CalendarMonthView;