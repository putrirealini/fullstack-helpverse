import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { FaCalendarAlt, FaChartBar, FaTable, FaFilter, FaBuilding, FaClipboardList, FaDownload } from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { ProtectedRoute } from "../components/protected-route";
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";

// Define types for the admin reports
interface ScheduleItem {
  id: string;
  event: {
    name: string;
    _id: string;
  };
  startTime: string;
  endTime: string;
  booked_by: {
    _id: string;
    username: string;
    fullName: string;
    organizerName: string;
  };
}

interface PastEvent {
  _id: string;
  name: string;
  date: string;
  time: string;
  organizer: {
    _id: string;
    username: string;
    fullName: string;
    organizerName: string;
  };
  totalSeats: number;
  availableSeats: number;
  occupancy: number;
  usageHours: number;
}

interface UtilizationData {
  date: string;
  total_hours_used: number;
  total_hours_available: number;
  utilization_percentage: number;
  events: string[];
}

function AdminReportContent() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"schedule" | "events" | "utilization">("schedule");
  const [dateRange, setDateRange] = useState<{from: string; to: string}>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days ago
    to: new Date().toISOString().split("T")[0] // today
  });
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [pastEvents, setPastEvents] = useState<PastEvent[]>([]);
  const [utilization, setUtilization] = useState<UtilizationData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [knownEventIds, setKnownEventIds] = useState<Map<string, string>>(new Map());
  
  // Theme colors for consistent UI
  const THEME_COLORS = {
    primary: '#7571F9',
    secondary: '#FF7F8A',
    tertiary: '#45D9A1',
    quaternary: '#FFB366',
    background: '#F7F7FF',
    lightGray: '#F0F0F7',
    darkText: '#242D60',
    lightText: '#677489'
  };
  
  // Load schedule data - Only for upcoming and current events
  const loadSchedule = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found. Please login again.');
      }
      
      // First, try to get all event data from the admin endpoint to get upcoming events
      try {
        const eventsResponse = await fetch('/api/admin/events', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          
          if (eventsData.data && Array.isArray(eventsData.data)) {
            // Filter for UPCOMING or CURRENT events based on date
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const futureEvents = eventsData.data.filter((event: any) => {
              if (!event.date) return false;
              
              // Convert event date to Date object
              const eventDate = new Date(event.date);
              eventDate.setHours(0, 0, 0, 0);
              
              // Event date must be same as or after today
              return eventDate >= today;
            });
            
            console.log('Found future events:', futureEvents.length);
            
            // Convert events to schedule item format
            if (futureEvents.length > 0) {
              const scheduleItems = futureEvents.map((event: any, index: number) => {
                // Create start and end times
                const eventDate = new Date(event.date);
                
                // Time based on event data
                let startHour = 0;
                let startMinute = 0;
                let duration = 0;
                
                // If there's time on the event, use it
                if (event.time) {
                  const timeParts = event.time.split(':');
                  if (timeParts.length >= 2) {
                    startHour = parseInt(timeParts[0], 10);
                    startMinute = parseInt(timeParts[1], 10);
                  }
                }
                
                // Event duration based on available data or API estimate
                if (event.duration) {
                  duration = event.duration;
                } else if (event.endTime && event.time) {
                  // Calculate duration if start and end time data is available
                  const eventStart = new Date(eventDate);
                  eventStart.setHours(startHour, startMinute, 0, 0);
                  
                  const eventEnd = new Date(event.endTime);
                  
                  // Duration in hours
                  duration = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60 * 60);
                } else {
                  // If no duration information, try to get from related data
                  duration = event.usageHours || 0;
                }
                
                // If still no valid duration, let the backend API determine
                if (duration <= 0) {
                  duration = 0; // API will handle default duration if needed
                }
                
                // Set start time
                const startTime = new Date(eventDate);
                startTime.setHours(startHour, startMinute, 0, 0);
                
                // Set end time based on duration
                const endTime = new Date(startTime);
                if (duration > 0) {
                  endTime.setTime(startTime.getTime() + (duration * 60 * 60 * 1000));
                }
                
                return {
                  id: event._id || event.id || `${index}`,
                  event: {
                    name: event.name,
                    _id: event._id || event.id
                  },
                  startTime: startTime.toISOString(),
                  endTime: endTime.toISOString(),
                  booked_by: event.createdBy || event.organizer || {
                    _id: event.organizerId || "",
                    username: event.organizerUsername || "",
                    fullName: event.organizerName || "",
                    organizerName: event.organizerName || ""
                  }
                };
              });
              
              // Filter schedule items based on selected date range
              const fromDate = new Date(dateRange.from);
              const toDate = new Date(dateRange.to);
              fromDate.setHours(0, 0, 0, 0);
              toDate.setHours(23, 59, 59, 999);
              
              const filteredSchedule = scheduleItems.filter((item: ScheduleItem) => {
                const itemDate = new Date(item.startTime);
                return itemDate >= fromDate && itemDate <= toDate;
              });
              
              console.log('Filtered future events in date range:', filteredSchedule.length);
              
              // Set schedule data
              setSchedule(filteredSchedule);
              return; // Exit function if successful
            }
          }
        }
      } catch (err) {
        console.error('Error fetching from admin events for schedule:', err);
      }
      
      // If not successful with admin events endpoint, use schedule endpoint
      const params = new URLSearchParams();
      params.append('from', dateRange.from);
      params.append('to', dateRange.to);
      
      const response = await fetch(`/api/admin/auditorium/schedule?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.status === 401) {
        throw new Error('Your session has expired. Please login again.');
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.message && data.message.includes("Insufficient data")) {
        setSchedule([]);
      } else {
        // Filter for ensuring only future events enter schedule
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const filteredSchedule = data.data ? data.data.filter((item: ScheduleItem) => {
          if (!item.startTime) return false;
          
          const itemDate = new Date(item.startTime);
          itemDate.setHours(0, 0, 0, 0);
          
          return itemDate >= today;
        }) : [];
        
        setSchedule(filteredSchedule || []);
      }
    } catch (err: any) {
      console.error('Failed to load schedule:', err);
      setError(err.message || 'Failed to load schedule data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Load past events data
  const loadPastEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found. Please login again.');
      }
      
      const params = new URLSearchParams();
      params.append('from', dateRange.from);
      params.append('to', dateRange.to);
      
      console.log('Loading past events with date range:', dateRange);
      
      // First, try to load events from admin events endpoint to get all events
      try {
        const eventsResponse = await fetch('/api/admin/events', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          console.log('Admin events data:', eventsData);
          
          if (eventsData.data && Array.isArray(eventsData.data) && eventsData.data.length > 0) {
            // Filter for events that have already passed based on current date
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const validEvents = eventsData.data.filter((event: any) => {
              if (!event.date) return false;
              
              // Convert event date to Date object
              const eventDate = new Date(event.date);
              eventDate.setHours(0, 0, 0, 0);
              
              // Check if event is within selected date range AND has already passed
              const fromDate = new Date(dateRange.from);
              const toDate = new Date(dateRange.to);
              fromDate.setHours(0, 0, 0, 0);
              toDate.setHours(23, 59, 59, 999);
              
              const isInDateRange = eventDate >= fromDate && eventDate <= toDate;
              const isPastEvent = eventDate < today; // Event has already passed
              
              return isInDateRange && isPastEvent;
            });
            
            console.log('Valid PAST events in date range:', validEvents.length);
            
            // Prepare event data with PastEvent format
            const formattedEvents = validEvents.map((event: any) => {
              // Calculate occupancy based on available data
              let occupancy = 0;
              if (event.totalSeats && event.availableSeats) {
                occupancy = ((event.totalSeats - event.availableSeats) / event.totalSeats) * 100;
              } else if (event.ticketsSold && event.totalSeats) {
                occupancy = (event.ticketsSold / event.totalSeats) * 100;
              }
              
              // Use event duration data from event if available, or default 3 hours as per API documentation
              // From API documentation: "Each event is assumed to have an average duration of 3 hours"
              const usageHours = 
                (typeof event.usageHours === 'number' && event.usageHours > 0) ? event.usageHours :
                (typeof event.duration === 'number' && event.duration > 0) ? event.duration : 3;
              
              return {
                _id: event._id || event.id,
                name: event.name,
                date: event.date,
                time: event.time || "",
                organizer: event.createdBy || event.organizer || {
                  _id: event.organizerId || "",
                  username: event.organizerUsername || "",
                  fullName: event.organizerName || "",
                  organizerName: event.organizerName || ""
                },
                totalSeats: event.totalSeats || 0,
                availableSeats: event.availableSeats || 0,
                occupancy: occupancy,
                usageHours: usageHours
              };
            });
            
            setPastEvents(formattedEvents);
            return; // Exit function if successful
          }
        }
      } catch (err) {
        console.error('Error fetching from admin events, falling back to events-held endpoint:', err);
        // Proceed to events-held endpoint if there's an error
      }
      
      // If not successful getting data from admin events endpoint, use events-held endpoint
      const response = await fetch(`/api/admin/auditorium/events-held?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.status === 401) {
        throw new Error('Your session has expired. Please login again.');
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Log the raw data for debugging
      console.log('Past events raw data from events-held:', data);
      
      if (data.message && data.message.includes("Insufficient data")) {
        setPastEvents([]);
      } else {
        // Filter events that are valid with stricter criteria - ONLY EVENTS THAT HAVE ALREADY PASSED
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const filteredEvents = data.data ? data.data.filter((event: PastEvent) => {
          // Verify minimal having basic data valid
          const hasBasicData = event._id && event.name && event.date;
          
          // Convert event date to Date object
          const eventDate = new Date(event.date);
          eventDate.setHours(0, 0, 0, 0);
          
          // Event date must be within selected date range
          const fromDate = new Date(dateRange.from);
          const toDate = new Date(dateRange.to);
          fromDate.setHours(0, 0, 0, 0);
          toDate.setHours(23, 59, 59, 999);
          
          const isInDateRange = eventDate >= fromDate && eventDate <= toDate;
          const isPastEvent = eventDate < today; // Event has already passed
          
          return hasBasicData && isInDateRange && isPastEvent;
        }) : [];
        
        // Use original data without giving default value
        const processedEvents = filteredEvents.map((event: PastEvent) => {
          // Give default value for occupancy if not available
          const occupancy = typeof event.occupancy === 'number' ? event.occupancy : 0;
          
          // Give default duration 3 hours if not available, as per API documentation
          // From API documentation: "Each event is assumed to have an average duration of 3 hours"
          const usageHours = 
            (typeof event.usageHours === 'number' && event.usageHours > 0) ? event.usageHours : 3;
          
          return {
            ...event,
            occupancy: occupancy,
            usageHours: usageHours
          };
        });
        
        setPastEvents(processedEvents);
      }
    } catch (err: any) {
      console.error('Failed to load past events:', err);
      setError(err.message || 'Failed to load events data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Load utilization data
  const loadUtilization = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found. Please login again.');
      }
      
      const params = new URLSearchParams();
      params.append('from', dateRange.from);
      params.append('to', dateRange.to);
      
      console.log('Loading utilization data with date range:', dateRange);
      
      // Get utilization data
      const response = await fetch(`/api/admin/auditorium/utilization?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.status === 401) {
        throw new Error('Your session has expired. Please login again.');
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.message && data.message.includes("Insufficient data")) {
        setUtilization([]);
      } else {
        // Console log for debug
        console.log('Utilization data received:', data.data);
        
        // First, get all events - both upcoming and past
        try {
          // Save all event names from pastEvents that already exist
          const knownEventIds = new Map<string, string>();
          
          pastEvents.forEach(event => {
            if (event._id && event.name) {
              knownEventIds.set(event._id, event.name);
            }
          });

          const eventsResponse = await fetch('/api/admin/events', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          if (eventsResponse.ok) {
            const eventsData = await eventsResponse.json();
            
            if (eventsData.data && Array.isArray(eventsData.data) && eventsData.data.length > 0) {
              // Save all event names for lookup later
              const newKnownEvents = new Map<string, string>(knownEventIds);
              
              eventsData.data.forEach((event: any) => {
                if (event._id && event.name) {
                  newKnownEvents.set(event._id, event.name);
                }
                if (event.id && event.name) {
                  newKnownEvents.set(event.id, event.name);
                }
              });
              
              // Update state with new event
              setKnownEventIds(newKnownEvents);
              
              const allEvents = eventsData.data.filter((event: any) => {
                if (!event.date) return false;
                
                // Check if event is within selected date range
                const eventDate = new Date(event.date);
                const fromDate = new Date(dateRange.from);
                const toDate = new Date(dateRange.to);
                fromDate.setHours(0, 0, 0, 0);
                toDate.setHours(23, 59, 59, 999);
                
                return eventDate >= fromDate && eventDate <= toDate;
              });
              
              console.log('All events for utilization:', allEvents.length);
              
              // Create event date map for utilization
              const eventDateMap = new Map();
              
              allEvents.forEach((event: any) => {
                if (!event.date) return;
                
                // Format date to YYYY-MM-DD
                const date = new Date(event.date);
                const dateKey = date.toISOString().split('T')[0];
                
                if (!eventDateMap.has(dateKey)) {
                  eventDateMap.set(dateKey, []);
                }
                
                // Duration from API data - as per API documentation, event has average duration of 3 hours
                // if no explicit data
                const eventDuration = event.usageHours > 0 ? event.usageHours : 
                                       event.duration > 0 ? event.duration : 3;
                
                eventDateMap.get(dateKey).push({
                  _id: event._id || event.id,
                  name: event.name,
                  duration: eventDuration
                });
              });
              
              // Log for debug
              console.log('Sample event data:', 
                Array.from(eventDateMap.entries())
                  .slice(0, 2)
                  .map(([date, events]) => ({
                    date,
                    eventCount: events.length,
                    totalDuration: events.reduce((sum: number, e: any) => sum + e.duration, 0)
                  }))
              );
              
              // Get all dates within selected date range
              const fromDate = new Date(dateRange.from);
              const toDate = new Date(dateRange.to);
              fromDate.setHours(0, 0, 0, 0);
              toDate.setHours(23, 59, 59, 999);
              
              const allDatesInRange = new Set<string>();
              const currentDate = new Date(fromDate);
              
              // Iterate through all dates within range
              while (currentDate <= toDate) {
                const dateKey = currentDate.toISOString().split('T')[0];
                allDatesInRange.add(dateKey);
                currentDate.setDate(currentDate.getDate() + 1);
              }
              
              // Filter utilization data to include only valid data
              const filteredUtilization = data.data ? data.data.filter((item: UtilizationData) => {
                // Ensure utilization data valid
                const hasValidData = 
                  typeof item.total_hours_used === 'number' && 
                  typeof item.total_hours_available === 'number' && 
                  typeof item.utilization_percentage === 'number';
                
                return hasValidData;
              }) : [];
              
              // Create Map to store utilization based on date
              const utilizationByDate = new Map<string, UtilizationData>();
              
              // Add existing utilization data to Map
              filteredUtilization.forEach((item: UtilizationData) => {
                const utilizationDate = new Date(item.date);
                const dateKey = utilizationDate.toISOString().split('T')[0];
                utilizationByDate.set(dateKey, {
                  ...item,
                  total_hours_available: 24 // Ensure all records use 24 hours as available
                });
              });
              
              // Create final result array with enriched data
              const enhancedUtilization: UtilizationData[] = [];
              
              // Iterate through each date within range and create or update utilization data
              allDatesInRange.forEach((dateKey) => {
                const eventsForDate = eventDateMap.get(dateKey) || [];
                const existingUtilization = utilizationByDate.get(dateKey);
                
                if (existingUtilization) {
                  // If existing utilization data exists, update with new event
                  const currentEventIds = new Set(existingUtilization.events || []);
                  const updatedEvents = [...currentEventIds];
                  
                  // Calculate total hours based on actual event duration
                  let additionalHours = 0;
                  
                  eventsForDate.forEach((event: any) => {
                    if (!currentEventIds.has(event._id)) {
                      updatedEvents.push(event._id);
                      
                      // Event duration is already guaranteed (default 3 hours from previous step)
                      additionalHours += event.duration;
                    }
                  });
                  
                  // Calculate total hours used
                  const totalHoursUsed = additionalHours > 0 ? 
                    Math.max(existingUtilization.total_hours_used, additionalHours) : 
                    existingUtilization.total_hours_used;
                  
                  // Calculate utilization percentage based on total hours (24 hours per day)
                  const utilizationPercentage = Math.min((totalHoursUsed / 24) * 100, 100);
                  
                  // Add updated item
                  enhancedUtilization.push({
                    ...existingUtilization,
                    events: updatedEvents,
                    total_hours_used: totalHoursUsed,
                    utilization_percentage: utilizationPercentage
                  });
                } else if (eventsForDate.length > 0) {
                  // If no utilization data but there are events, create new data
                  interface EventWithId {
                    _id: string;
                    name?: string;
                    duration: number;
                  }
                  
                  const eventIds = eventsForDate.map((event: EventWithId) => event._id);
                  
                  // Calculate total hours - event duration already exists from previous step (default 3 hours)
                  const totalHoursUsed = eventsForDate.reduce((sum: number, event: EventWithId) => 
                    sum + event.duration, 0);
                  
                  // Total hours available per day is 24 hours
                  const totalHoursAvailable = 24;
                  const utilizationPercentage = (totalHoursUsed / totalHoursAvailable) * 100;
                  
                  // Create date from dateKey
                  const dateParts = dateKey.split('-');
                  const utilizationDate = new Date(
                    parseInt(dateParts[0]), 
                    parseInt(dateParts[1]) - 1, // Month starts from 0
                    parseInt(dateParts[2])
                  );
                  
                  // Add new utilization data
                  enhancedUtilization.push({
                    date: utilizationDate.toISOString(),
                    total_hours_used: totalHoursUsed,
                    total_hours_available: totalHoursAvailable,
                    utilization_percentage: utilizationPercentage,
                    events: eventIds
                  });
                }
              });
              
              // Sort utilization based on date
              enhancedUtilization.sort((a, b) => {
                return new Date(a.date).getTime() - new Date(b.date).getTime();
              });
              
              // Ensure all utilization records use 24 hours as available hours and update percentage
              const finalUtilization = enhancedUtilization.map(item => ({
                ...item,
                total_hours_available: 24,
                utilization_percentage: Math.min((item.total_hours_used / 24) * 100, 100)
              }));
              
              console.log('Enhanced utilization data with all events:', finalUtilization.length);
              setUtilization(finalUtilization);
              return;
            }
          }
        } catch (err) {
          console.error('Error enhancing utilization with events data:', err);
        }
        
        // Jika data dari backend, tetapkan total_hours_available ke 24
        const processedUtilization = data.data ? data.data.map((item: UtilizationData) => ({
          ...item,
          total_hours_available: 24,
          utilization_percentage: Math.min((item.total_hours_used / 24) * 100, 100)
        })) : [];
        
        setUtilization(processedUtilization);
      }
    } catch (err: any) {
      console.error('Failed to load utilization:', err);
      setError(err.message || 'Failed to load utilization data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to load all event names
  const loadAllEventNames = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token not found for loading event names');
        return;
      }
      
      // Get from /api/admin/events for all events
      const eventsResponse = await fetch('/api/admin/events', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        
        if (eventsData.data && Array.isArray(eventsData.data)) {
          const newKnownEvents = new Map<string, string>(knownEventIds);
          
          eventsData.data.forEach((event: any) => {
            if (event._id && event.name) {
              // Add clearer format with date
              const eventDate = event.date ? ` - ${new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : '';
              newKnownEvents.set(event._id, `${event.name}${eventDate}`);
            }
            
            // Some APIs may use id field instead of _id
            if (event.id && event.name && event.id !== event._id) {
              const eventDate = event.date ? ` - ${new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : '';
              newKnownEvents.set(event.id, `${event.name}${eventDate}`);
            }
          });
          
          setKnownEventIds(newKnownEvents);
          console.log(`Loaded ${newKnownEvents.size} event names for reference`);
        }
      }
      
      // Also try getting from /api/events for public events
      const publicEventsResponse = await fetch('/api/events', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (publicEventsResponse.ok) {
        const publicEventsData = await publicEventsResponse.json();
        
        if (publicEventsData.data && Array.isArray(publicEventsData.data)) {
          const newKnownEvents = new Map<string, string>(knownEventIds);
          
          publicEventsData.data.forEach((event: any) => {
            if (event._id && event.name) {
              const eventDate = event.date ? ` - ${new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : '';
              newKnownEvents.set(event._id, `${event.name}${eventDate}`);
            }
            
            if (event.id && event.name && event.id !== event._id) {
              const eventDate = event.date ? ` - ${new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : '';
              newKnownEvents.set(event.id, `${event.name}${eventDate}`);
            }
          });
          
          setKnownEventIds(newKnownEvents);
        }
      }
    } catch (error) {
      console.error('Error loading all event names:', error);
    }
  };
  
  // Load event names when component loads
  useEffect(() => {
    loadAllEventNames();
  }, []);
  
  // Load data based on active tab
  useEffect(() => {
    if (activeTab === "schedule") {
      loadSchedule();
    } else if (activeTab === "events") {
      loadPastEvents();
    } else if (activeTab === "utilization") {
      loadUtilization();
    }
  }, [activeTab, dateRange]);
  
  // Format number with 1 decimal place
  const formatNumber = (value: number): string => {
    return Number(value.toFixed(1)).toString();
  };

  // Calculate average utilization
  const calculateAverageUtilization = (utilizationData: UtilizationData[]) => {
    if (!utilizationData || utilizationData.length === 0) return 0;
    
    // Hitung total penggunaan jam dan total jam tersedia
    const totalHoursUsed = utilizationData.reduce((sum, item) => sum + item.total_hours_used, 0);
    const totalHoursAvailable = 24 * utilizationData.length; // 24 jam per hari
    
    // Hitung rata-rata persentase utilisasi secara keseluruhan
    const averageUtilization = (totalHoursUsed / totalHoursAvailable) * 100;
    const roundedAverage = Math.round(averageUtilization * 10) / 10;
    
    console.log(`Average utilization calculation: ${totalHoursUsed} / ${totalHoursAvailable} = ${roundedAverage}%`);
    
    return roundedAverage;
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Calculate average occupancy
  const calculateAverageOccupancy = (events: PastEvent[]) => {
    if (!events || events.length === 0) return 0;
    
    // Log the events for debugging
    console.log('Calculating average from events:', events.map((e: PastEvent) => e.occupancy));
    
    // Sum up all occupancy values
    const total = events.reduce((sum: number, event: PastEvent) => {
      // Ensure we're using a number and not undefined/NaN
      const eventOccupancy = typeof event.occupancy === 'number' ? event.occupancy : 0;
      return sum + eventOccupancy;
    }, 0);
    
    // Calculate average and round to 1 decimal place
    const average = total / events.length;
    const roundedAverage = Math.round(average * 10) / 10;
    
    console.log(`Average occupancy calculation: ${total} / ${events.length} = ${roundedAverage}%`);
    
    return roundedAverage;
  };
  
  // Function to get event name by ID
  const getEventNameById = (eventId: string): string => {
    // Function to get event name by ID
    if (!eventId || eventId === "unknown" || eventId === "undefined") {
      return "Unknown Event";
    }
    
    // Check if the ID is in the knownEventIds map
    if (knownEventIds.has(eventId)) {
      return knownEventIds.get(eventId) || "Unknown Event";
    }
    
    // Check if it's a combined ID with format eventId_date
    if (eventId.includes('_')) {
      const parts = eventId.split('_');
      const baseEventId = parts[0];
      
      // Check if the base ID is known
      if (knownEventIds.has(baseEventId)) {
        // Get the event name and format with date if available
        const eventName = knownEventIds.get(baseEventId) || "Unknown Event";
        if (parts.length > 1) {
          try {
            // Format with date if valid date part is available
            const datePart = parts[1];
            const date = new Date(datePart);
            if (!isNaN(date.getTime())) {
              return `${eventName} - ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            }
          } catch (err) {
            console.error('Error parsing date from event ID:', err);
          }
        }
        return eventName;
      }
    }
    
    // Try to find a matching event in pastEvents
    const matchingPastEvent = pastEvents.find(event => event._id === eventId);
    if (matchingPastEvent && matchingPastEvent.name) {
      const eventDate = matchingPastEvent.date ? 
        ` - ${new Date(matchingPastEvent.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : '';
      return `${matchingPastEvent.name}${eventDate}`;
    }
    
    return "Unknown Event";
  };
  
  // Download report function
  const downloadReport = async () => {
    // Function to download report based on date range
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found. Please login again.');
      }
      
      // Create URL parameters with date range
      const params = new URLSearchParams();
      params.append('type', 'all');
      // params.append('from', dateRange.from);
      // params.append('to', dateRange.to);
      
      // Construct URL with parameters
      const url = `/api/admin/auditorium/download-report?${params.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.status === 401) {
        throw new Error('Your session has expired. Please login again.');
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      // Get blob data for PDF download
      const blob = await response.blob();
      
      // Create download link and trigger click
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `auditorium-report-${dateRange.from}-to-${dateRange.to}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      // Clean up URL object
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error('Error downloading report:', err);
      setError(err.message || 'Failed to download report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };
  
  // Function to load all event data
  const loadAllEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token not found for loading events');
        return;
      }
      
      console.log('Loading all events data for reference...');
      
      // Fetch from /api/admin/events to get all events
      const response = await fetch('/api/admin/events', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.data && Array.isArray(data.data)) {
          console.log(`Loaded ${data.data.length} events from API`);
          
          // Add to pastEvents if not already exists
          const existingIds = new Set(pastEvents.map(e => e._id));
          const newEvents = data.data.filter((event: any) => !existingIds.has(event._id || event.id))
            .map((event: any) => {
              // Format event to PastEvent structure
              const occupancy = 
                (event.totalSeats && event.availableSeats) ? 
                  ((event.totalSeats - event.availableSeats) / event.totalSeats) * 100 : 
                (event.ticketsSold && event.totalSeats) ?
                  (event.ticketsSold / event.totalSeats) * 100 : 0;
                  
              const usageHours = 
                (typeof event.usageHours === 'number' && event.usageHours > 0) ? event.usageHours :
                (typeof event.duration === 'number' && event.duration > 0) ? event.duration : 3;
              
              return {
                _id: event._id || event.id,
                name: event.name,
                date: event.date,
                time: event.time || "",
                organizer: event.createdBy || event.organizer || {
                  _id: event.organizerId || "",
                  username: event.organizerUsername || "",
                  fullName: event.organizerName || "",
                  organizerName: event.organizerName || ""
                },
                totalSeats: event.totalSeats || 0,
                availableSeats: event.availableSeats || 0,
                occupancy: occupancy,
                usageHours: usageHours
              };
            });
          
          // Combine with existing pastEvents
          if (newEvents.length > 0) {
            console.log(`Adding ${newEvents.length} new events to pastEvents for reference`);
            setPastEvents(prevEvents => [...prevEvents, ...newEvents]);
          }
        }
      } else {
        console.error('Failed to load events from API:', response.status);
      }
    } catch (err) {
      console.error('Error loading all events:', err);
    }
  };

  // Load events when component loads
  useEffect(() => {
    loadAllEvents();
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col bg-secondary">
      <Navbar />
      <div className="flex-grow container mx-auto px-4 py-6 mt-20">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Auditorium Management</h1>
            <p className="text-sm text-gray-600 mt-1">Monitor auditorium usage, events, and utilization</p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Date range selector */}
            <div className="flex items-center gap-2 bg-white p-2 rounded-md shadow-sm">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
                <input
                  type="date"
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
                <input
                  type="date"
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                />
              </div>
            </div>
            
            {/* Download button */}
            <button
              onClick={downloadReport}
              disabled={downloading || loading}
              className="flex items-center bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Downloading...
                </>
              ) : (
                <>
                  <FaDownload className="mr-2" />
                  Download Report
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Tab navigation */}
        <div className="flex mb-6 border-b">
          <button
            className={`px-4 py-2 font-medium text-sm flex items-center ${activeTab === 'schedule' ? 'border-b-2 border-primary text-primary' : 'text-gray-600'}`}
            onClick={() => setActiveTab('schedule')}
          >
            <FaCalendarAlt className="mr-2" />
            Schedule
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm flex items-center ${activeTab === 'events' ? 'border-b-2 border-primary text-primary' : 'text-gray-600'}`}
            onClick={() => setActiveTab('events')}
          >
            <FaClipboardList className="mr-2" />
            Past Events
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm flex items-center ${activeTab === 'utilization' ? 'border-b-2 border-primary text-primary' : 'text-gray-600'}`}
            onClick={() => setActiveTab('utilization')}
          >
            <FaChartBar className="mr-2" />
            Utilization
          </button>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading indicator */}
        {loading && (
          <div className="w-full flex justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
        
        {/* Tab content */}
        {!loading && !error && (
          <>
            {/* Schedule Tab */}
            {activeTab === 'schedule' && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-lg font-semibold mb-4">Upcoming Auditorium Schedule</h2>
                
                {schedule.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FaCalendarAlt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No scheduled events for the selected period</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organizer</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {schedule.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.event?.name || "Unnamed Event"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {new Date(item.startTime).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {new Date(item.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                              {new Date(item.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {item.booked_by?.organizerName || item.booked_by?.fullName || "Unknown Organizer"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Past Events Tab */}
            {activeTab === 'events' && (
              <div className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white rounded-lg shadow-md p-4 border-t-4" style={{ borderTopColor: THEME_COLORS.primary }}>
                    <h3 className="text-sm font-medium text-gray-500">Total Events</h3>
                    <p className="text-2xl font-bold">{pastEvents.length}</p>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-md p-4 border-t-4" style={{ borderTopColor: THEME_COLORS.tertiary }}>
                    <h3 className="text-sm font-medium text-gray-500">Average Occupancy</h3>
                    <p className="text-2xl font-bold">
                      {pastEvents.length 
                        ? `${calculateAverageOccupancy(pastEvents)}%` 
                        : '0%'}
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-md p-4 border-t-4" style={{ borderTopColor: THEME_COLORS.quaternary }}>
                    <h3 className="text-sm font-medium text-gray-500">Total Hours Used</h3>
                    <p className="text-2xl font-bold">
                      {formatNumber(pastEvents.reduce((sum, event) => sum + event.usageHours, 0))}
                    </p>
                  </div>
                </div>
                
                {/* Events Table */}
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h2 className="text-lg font-semibold mb-4">Events Held</h2>
                  
                  {pastEvents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FaClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No past events for the selected period</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organizer</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occupancy</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {pastEvents.map((event, index) => (
                            <tr key={event._id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{event.name}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(event.date)} {event.time}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {event.organizer?.organizerName || event.organizer?.fullName || "Unknown Organizer"}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center">
                                  <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                    <div 
                                      className="h-2.5 rounded-full" 
                                      style={{ 
                                        width: `${event.occupancy}%`,
                                        backgroundColor: event.occupancy > 75 
                                          ? THEME_COLORS.tertiary 
                                          : event.occupancy > 50 
                                            ? THEME_COLORS.quaternary 
                                            : THEME_COLORS.secondary
                                      }}
                                    ></div>
                                  </div>
                                  <span>{event.occupancy.toFixed(1)}%</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatNumber(event.usageHours)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Utilization Tab */}
            {activeTab === 'utilization' && (
              <div className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white rounded-lg shadow-md p-4 border-t-4" style={{ borderTopColor: THEME_COLORS.primary }}>
                    <h3 className="text-sm font-medium text-gray-500">Average Utilization</h3>
                    <p className="text-2xl font-bold">{calculateAverageUtilization(utilization)}%</p>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-md p-4 border-t-4" style={{ borderTopColor: THEME_COLORS.tertiary }}>
                    <h3 className="text-sm font-medium text-gray-500">Total Hours Available</h3>
                    <p className="text-2xl font-bold">
                      {formatNumber(24 * utilization.length)}
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-md p-4 border-t-4" style={{ borderTopColor: THEME_COLORS.quaternary }}>
                    <h3 className="text-sm font-medium text-gray-500">Total Hours Used</h3>
                    <p className="text-2xl font-bold">
                      {formatNumber(utilization.reduce((sum, item) => sum + item.total_hours_used, 0))}
                    </p>
                  </div>
                </div>
                
                {/* Utilization Chart */}
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h2 className="text-lg font-semibold mb-4">Utilization Over Time</h2>
                  
                  {utilization.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FaChartBar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No utilization data for the selected period</p>
                    </div>
                  ) : (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={utilization}
                          margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f7" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12, fill: THEME_COLORS.lightText }} 
                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            domain={[0, 100]}
                            unit="%"
                            tick={{ fontSize: 12, fill: THEME_COLORS.lightText }}
                          />
                          <Tooltip 
                            formatter={(value: any) => [`${value}%`, 'Utilization']}
                            labelFormatter={(label) => formatDate(label as string)}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="utilization_percentage" 
                            name="Utilization" 
                            stroke={THEME_COLORS.primary} 
                            strokeWidth={2}
                            dot={{ r: 4, fill: THEME_COLORS.primary, strokeWidth: 0 }}
                            activeDot={{ r: 6, fill: THEME_COLORS.primary, strokeWidth: 0 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
                
                {/* Utilization Table */}
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h2 className="text-lg font-semibold mb-4">Utilization Details</h2>
                  
                  {utilization.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FaChartBar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No utilization data for the selected period</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours Used</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours Available</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilization</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Events</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {utilization.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatDate(item.date)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatNumber(item.total_hours_used)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatNumber(24)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center">
                                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                    <div 
                                      className="h-2 rounded-full" 
                                      style={{ 
                                        width: `${item.utilization_percentage}%`,
                                        backgroundColor: item.utilization_percentage > 75 
                                          ? THEME_COLORS.tertiary 
                                          : item.utilization_percentage > 50 
                                            ? THEME_COLORS.quaternary 
                                            : THEME_COLORS.secondary
                                      }}
                                    ></div>
                                  </div>
                                  <span title={`${formatNumber(item.total_hours_used)} jam dari 24 jam`}>{item.utilization_percentage.toFixed(1)}%</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {item.events && item.events.length > 0 
                                  ? (
                                    <div className="space-y-1">
                                      {item.events.map((eventId, idx) => {
                                        const eventName = getEventNameById(eventId);
                                        const isUnknownEvent = eventName === 'Event (ID not found)' || eventName === 'Unknown Event';
                                        
                                        return (
                                          <div 
                                            key={idx} 
                                            className={`text-xs px-2 py-1 rounded ${isUnknownEvent ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}
                                            title={isUnknownEvent ? `Event ID: ${eventId}` : eventName}
                                          >
                                            {eventName}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )
                                  : 'None'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default function AdminReportsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminReportContent />
    </ProtectedRoute>
  );
} 