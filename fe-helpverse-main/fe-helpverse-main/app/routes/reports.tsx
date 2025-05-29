import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { FaFileDownload, FaChartBar, FaCalendarAlt, FaTable, FaFilter } from "react-icons/fa";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  Area, AreaChart, RadialBarChart, RadialBar
} from "recharts";
import { ProtectedRoute } from "../components/protected-route";
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";

// Definisi tipe data
interface DailyReport {
  date: string;
  ticketsSold: number;
  revenue: number;
  occupancyPercentage: number;
  salesData: { hour: number; count: number }[];
  revenueData: { hour: number; amount: number }[];
}

interface WeeklyReport {
  startDate: string;
  endDate: string;
  ticketsSold: number;
  revenue: number;
  occupancyPercentage: number;
  salesData: { day: string; count: number }[];
  revenueData: { day: string; amount: number }[];
}

interface MonthlyReport {
  month: number;
  year: number;
  ticketsSold: number;
  revenue: number;
  occupancyPercentage: number;
  salesData: { day: number; count: number }[];
  revenueData: { day: number; amount: number }[];
}

type Report = DailyReport | WeeklyReport | MonthlyReport;

// Data untuk tampilan tabel
interface TableData {
  id: string;
  date: string;
  ticketsSold: number;
  revenue: number;
  seatsFilledPercent: number;
}

function ReportPageContent() {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly" | "all">("monthly");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showTable, setShowTable] = useState<boolean>(false);
  const [noDataMessage, setNoDataMessage] = useState<string | null>(null);
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("all");

  // Colors untuk charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Modern theme colors
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

  // Gradient styles for charts
  const getGradientColors = (type: string) => {
    switch(type) {
      case 'tickets':
        return ['#7571F9', '#5A56D5'];
      case 'revenue':
        return ['#45D9A1', '#32BE8D'];
      case 'occupied':
        return ['#7571F9', '#5A56D5'];
      case 'available':
        return ['#EAEAFA', '#D3D2F7'];
      default:
        return ['#7571F9', '#5A56D5'];
    }
  };

  // Custom tooltip styles
  const CustomTooltip = ({ active, payload, label, formatter }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-md rounded-md">
          <p className="text-xs font-medium text-gray-600">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-xs" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}: </span>
              {formatter ? formatter(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Function to format currency (RM)
  const formatCurrency = (value: number) => {
    return `RM ${value.toFixed(2)}`;
  };

  // Function to format percentage with two decimals
  const formatPercentage = (value: number) => {
    return Number(value.toFixed(2));
  };

  // Function to load events belonging to the event organizer
  const loadEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found. Please login again.');
      }
      
      console.log('Loading events data...');
      
      const response = await fetch('/api/events/my-events', {
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
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('Events data received:', data);
      
      // Storing event data for dropdown
      if (data.data && Array.isArray(data.data)) {
        const eventOptions = data.data.map((event: any) => ({
          id: event._id || event.id,
          name: event.name
        }));
        
        console.log('Parsed event options:', eventOptions);
        
        if (eventOptions.length === 0) {
          console.warn('No events found for this organizer');
          setEvents([{ id: "all", name: "All Events" }]);
        } else {
          // Add "All Events" option at the beginning
          setEvents([{ id: "all", name: "All Events" }, ...eventOptions]);
        }
      } else {
        console.warn('No event data found or invalid format:', data);
        setEvents([{ id: "all", name: "All Events" }]);
      }
    } catch (err: any) {
      console.error('Failed to load events:', err);
      setError(`Failed to load events: ${err.message}`);
      setEvents([{ id: "all", name: "All Events" }]);
    }
  };

  // Load events when component mounts
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await loadEvents();
        
        // Load initial data from /api/reports/all endpoint as default
        await loadAllReports();
      } catch (err) {
        console.error("Gagal memuat data awal:", err);
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

  // Specific function to load data from /api/reports/all
  const loadAllReports = async () => {
    setLoading(true);
    setError(null);
    setNoDataMessage(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found. Please login again.');
      }
      
      // Create URL with eventId parameter if specific event is selected
      let url = '/api/reports/all';
      const params = new URLSearchParams();
      
      if (selectedEvent !== "all") {
        params.append('eventId', selectedEvent);
      }
      
      // Add parameters to URL if any exist
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log(`Loading all reports with URL: ${url}`);
      
      // Get data from /api/reports/all endpoint with or without eventId parameter
      const response = await fetch(url, {
        method: 'GET',
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
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API response data for all reports:', data);
      
      // Check if API returns error message related to event
      if (data.message && data.message.includes("Event not found")) {
        setNoDataMessage(data.message);
        setReport(null);
        setTableData([]);
        return;
      }
      
      // Check if API returns "No data available" message
      if (data.message && data.message === "No data available.") {
        console.warn('API returned: No data available.');
        setNoDataMessage("No data available for the selected filters.");
        setReport(null);
        setTableData([]);
        return;
      }
      
      // Check if there is no meaningful data in the response
      if (data && data.ticketsSold === 0 && data.revenue === 0 && 
          (!data.ordersByDate || Object.keys(data.ordersByDate).length === 0)) {
        setNoDataMessage("No sales data found for the selected event. Try selecting a different event or date range.");
        setReport(null);
        setTableData([]);
        return;
      }
      
      if (data) {
        // Format data for report display
        const allReportData = {
          ticketsSold: data.ticketsSold || 0,
          revenue: data.revenue || 0,
          occupancyPercentage: data.occupancyPercentage || 0,
          startDate: "All Time", // for weekly format
          endDate: "Report",
          salesData: Object.keys(data.ordersByDate || {}).map(date => ({
            day: date,
            count: (data.ordersByDate[date] || []).length
          })),
          revenueData: Object.keys(data.ordersByDate || {}).map(date => ({
            day: date,
            amount: (data.ordersByDate[date] || []).reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0)
          })),
          occupancyData: data.occupancyByDate ? Object.keys(data.occupancyByDate || {}).map(date => ({
            day: date,
            percentage: data.occupancyByDate[date] || data.occupancyPercentage
          })) : []
        };
        
        // Debug log for processed data
        console.log('Processed report data:', {
          ticketsSold: allReportData.ticketsSold,
          revenue: allReportData.revenue,
          salesDataPoints: allReportData.salesData.length,
          revenueDataPoints: allReportData.revenueData.length
        });
        
        // Set report as weekly report for display
        setReport({
          startDate: allReportData.salesData.length > 0 ? allReportData.salesData[0].day : "All Time",
          endDate: allReportData.salesData.length > 0 ? allReportData.salesData[allReportData.salesData.length - 1].day : "Report",
          ticketsSold: allReportData.ticketsSold,
          revenue: allReportData.revenue,
          occupancyPercentage: allReportData.occupancyPercentage,
          salesData: allReportData.salesData,
          revenueData: allReportData.revenueData
        } as WeeklyReport);
        
        // Create table data
        if (allReportData.salesData.length > 0) {
          const tableRows = allReportData.salesData.map((item, index) => {
            // Search for occupancy for this date if available
            const dateOccupancy = allReportData.occupancyData && allReportData.occupancyData.length > 0
              ? allReportData.occupancyData.find(o => o.day === item.day)?.percentage
              : null;
            
            // Jika tidak ada tiket terjual, set persentase kursi terisi menjadi 0
            const seatsFilledPercent = item.count === 0 ? 0 : formatPercentage(dateOccupancy || data.occupancyPercentage);
            
            return {
              id: index.toString(),
              date: item.day,
              ticketsSold: item.count,
              revenue: allReportData.revenueData[index]?.amount || 0,
              seatsFilledPercent: seatsFilledPercent
            };
          });
          setTableData(tableRows);
        } else {
          // Fallback jika tidak ada data tanggal
          setTableData([{
            id: "1",
            date: "All Time",
            ticketsSold: allReportData.ticketsSold,
            revenue: allReportData.revenue,
            seatsFilledPercent: allReportData.ticketsSold === 0 ? 0 : formatPercentage(allReportData.occupancyPercentage)
          }]);
        }
      } else {
        // Pesan untuk debugging
        console.warn('API mengembalikan data yang tidak sesuai format yang diharapkan:', data);
        
        // Set report ke null agar tampilkan pesan "Tidak ada data"
        setNoDataMessage("Received invalid data format from server.");
        setReport(null);
        setTableData([]);
      }
    } catch (err: any) {
      console.error('Failed to load all reports:', err);
      
      // Set report ke null agar tampilkan pesan "Tidak ada data"
      setError(err.message || "Failed to load report data. Please try again later.");
      setReport(null);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk mengecek apakah token masih valid
  const checkTokenValidity = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      
      // Coba panggil endpoint /api/auth/me untuk verifikasi token
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      return response.ok;
    } catch (e) {
      console.error('Token validity check failed:', e);
      return false;
    }
  };

  // Download report sebagai PDF
  const downloadReport = async () => {
    try {
      setLoading(true);
      setError(null);

      // Dapatkan token dari localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found. Please login again.');
      }
      
      // Buat query parameters
      const params = new URLSearchParams();
      
      // Cek apakah ada filter aktif (report type selain default)
      // Jika tidak ada filter, gunakan 'all'
      const isFilterActive = reportType !== "monthly";
      const downloadType = isFilterActive ? reportType : 'all';
      
      // Gunakan tipe yang sesuai dengan permintaan
      params.append('type', downloadType);
      
      // Format tanggal yang konsisten
      let formattedDate = '';
      // Tanggal diperlukan untuk tipe 'daily' dan 'monthly', tetapi tidak untuk 'weekly' dan 'all'
      if (downloadType !== 'weekly' && downloadType !== 'all' as string) {
        formattedDate = selectedDate.split('T')[0]; // Pastikan format tanggal bersih
        params.append('date', formattedDate);
      }
      
      // Tambahkan eventId jika event tertentu dipilih
      if (selectedEvent !== "all") {
        params.append('eventId', selectedEvent);
      }
      
      // Log parameter untuk debugging
      console.log(`Downloading report with parameters: ${params.toString()}`);
      
      // Buat fetch request dengan explicit headers
      const response = await fetch(`/api/reports/download?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf, application/json'
        }
      });
      
      // Log status untuk debugging
      console.log('Download response status:', response.status, response.statusText);
      console.log('Response headers:', {
        contentType: response.headers.get('content-type'),
        contentDisposition: response.headers.get('content-disposition')
      });
      
      // Handle token expiration
      if (response.status === 401) {
        throw new Error('Your session has expired. Please login again.');
      }
      
      // Periksa apakah ada pesan error terkait event
      if (response.status === 200 || response.status === 400) {
        const contentType = response.headers.get('content-type');
        
        // Jika server mengembalikan JSON, periksa apakah itu pesan error
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          
          if (data.message) {
            if (data.message.includes("Event not found")) {
              throw new Error(data.message);
            } else if (data.message.includes("Insufficient data")) {
              throw new Error('No data available for the selected period. Please select a different date range.');
            }
          }
          
          throw new Error('Server returned data in an unexpected format.');
        }
      }
      
      // Handle error umum
      if (!response.ok) {
        // Coba baca pesan error
        const errorText = await response.text();
        try {
          // Jika error dalam format JSON
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || `Error ${response.status}: ${response.statusText}`);
        } catch (e) {
          // Jika bukan JSON, gunakan text error langsung
          throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
        }
      }
      
      // Pastikan konten yang dikembalikan adalah PDF
      const contentType = response.headers.get('content-type');
      
      // Jika server mengembalikan JSON bukan PDF
      if (contentType && contentType.includes('application/json')) {
        const jsonData = await response.json();
        console.warn('Server returned JSON instead of PDF:', jsonData);
        
        if (jsonData.message) {
          throw new Error(jsonData.message);
        } else {
          throw new Error('Server returned JSON data instead of a PDF file');
        }
      }
      
      // Ambil data sebagai blob
      const blob = await response.blob();
      console.log('Blob size:', blob.size, 'bytes');
      
      // Jika blob kosong atau terlalu kecil
      if (blob.size < 100) {
        throw new Error('The downloaded file appears to be empty or invalid');
      }
      
      // Cari nama file dari header content-disposition
      let filename = `report-${downloadType}-${downloadType !== 'weekly' && downloadType !== 'all' as string ? formattedDate : 'current'}.pdf`;
      const contentDisposition = response.headers.get('content-disposition');
      if (contentDisposition && contentDisposition.includes('filename=')) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      
      // Buat URL dan elemen download
      const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 200);
      
      // Reset state
      setError(null);
      
    } catch (err: any) {
      console.error('Download error:', err);
      setError(`Failed to download report: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Buat ref di dalam body fungsi komponen
  const isInitialMount = useRef(true);
  
  // Load report saat paramater filter berubah
  useEffect(() => {
    // Skip pada mounting awal karena sudah dimuat di useEffect sebelumnya
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    console.log('Filter changed - reloading report with:', {
      reportType,
      selectedDate,
      selectedEvent
    });
    
    // Reset data saat memilih event baru atau mengubah tipe report
    if (selectedEvent !== "all" || reportType !== "monthly") {
      // Reset semua data untuk memastikan tampilan konsisten dengan filter baru
      setNoDataMessage("Loading data for selected filters...");
      setReport(null);
      setTableData([]);
      
      // Jika tabel sedang terbuka, tutup untuk hindari menampilkan data lama
      if (showTable) {
        setShowTable(false);
      }
    }
    
    // Jalankan loadReport saat filter berubah 
    loadReport();
  }, [reportType, selectedDate, selectedEvent]);
  
  // Fungsi untuk mengecek apakah tanggal yang dipilih ada di masa depan
  const isFutureDate = (dateToCheck: string, reportType: string): boolean => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // Bulan dimulai dari 0
    const currentDay = today.getDate();
    
    // Parse tanggal yang dipilih
    const selectedDateObj = new Date(dateToCheck);
    const selectedYear = selectedDateObj.getFullYear();
    const selectedMonth = selectedDateObj.getMonth() + 1;
    const selectedDay = selectedDateObj.getDate();
    
    // Cek berdasarkan tipe report
    if (reportType === "daily") {
      // Tanggal di masa depan
      return selectedDateObj > today;
    } else if (reportType === "monthly") {
      // Bulan di masa depan dalam tahun yang sama
      if (selectedYear === currentYear) {
        return selectedMonth > currentMonth;
      }
      // Tahun di masa depan
      return selectedYear > currentYear;
    }
    
    // Default return false untuk tipe "weekly" atau "all"
    return false;
  };

  // Fungsi untuk memuat report berdasarkan filter
  const loadReport = async () => {
    setLoading(true);
    setError(null);
    setNoDataMessage(null);
    setTableData([]); // Reset table data ketika filter berubah
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found. Please login again.');
      }
      
      // Periksa jika tanggal yang dipilih ada di masa depan
      if (reportType !== 'all' && reportType !== 'weekly') {
        const formattedDate = selectedDate.split('T')[0];
        if (isFutureDate(formattedDate, reportType)) {
          setNoDataMessage("No data available for future dates. Please select a different date or month.");
          setReport(null);
          setTableData([]);
          setLoading(false);
          return;
        }
      }
      
      // Jika memilih tipe 'all', gunakan endpoint /api/reports/all
      if (reportType === 'all') {
        await loadAllReports();
        return;
      }
      
      // Buat query parameters
      const params = new URLSearchParams();
      
      // Tambahkan parameter filter
      if (reportType !== "weekly") {
        const formattedDate = selectedDate.split('T')[0];
        params.append('date', formattedDate);
      }
      
      // Tambahkan eventId jika event tertentu dipilih
      if (selectedEvent !== "all") {
        params.append('eventId', selectedEvent);
      }
      
      const url = `/api/reports/${reportType}?${params.toString()}`;
      console.log(`Loading report with URL: ${url}`);
      
      // Buat fetch request
      const response = await fetch(url, {
        method: 'GET',
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
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`API response data for ${reportType} report:`, data);
      
      // Jika API mengembalikan pesan error terkait event
      if (data.message && data.message.includes("Event not found")) {
        setNoDataMessage(data.message);
        setReport(null);
        setTableData([]);
        return;
      }
      
      // Jika tidak ada data untuk filter, tampilkan pesan no data
      if (data.message && data.message.includes("Insufficient data")) {
        setNoDataMessage("No data available for the selected date. Please choose another date or time period.");
        setReport(null);
        setTableData([]);
        return;
      }
      
      // Proses data normal jika ada
      processReportData(data);
      
    } catch (err: any) {
      console.error('Failed to load report:', err);
      
      // Set pesan error
      setError(err.message || 'Failed to load report data. Please try again.');
      setReport(null);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  // Format data untuk tabel berdasarkan tipe report
  const processReportData = (data: any) => {
    console.log('Processing report data:', data);
    
    // Jika tidak ada data atau error message
    if (!data || (data.message && (data.message.includes("Insufficient data") || data.message.includes("No data")))) {
      setNoDataMessage("No data available for the selected date. Please choose another date or time period.");
      setReport(null);
      setTableData([]);
      return;
    }
    
    // Jika data kosong (tidak ada penjualan)
    if ((data.ticketsSold === 0 || data.ticketsSold === undefined) && 
        (data.revenue === 0 || data.revenue === undefined) && 
        (!data.salesData || data.salesData?.length === 0)) {
      setNoDataMessage("No sales data found for the selected period. Please select a different date range.");
      setReport(null);
      setTableData([]);
      return;
    }
    
    // Reset pesan no data jika ada data
    setNoDataMessage(null);
    
    // Cek apakah ini data dari /api/reports/all
    if (data.totalOrders !== undefined && data.ordersData) {
      // Format data dari /api/reports/all
      const allReportData = {
        ticketsSold: data.ticketsSold || 0,
        revenue: data.revenue || 0,
        occupancyPercentage: data.occupancyPercentage || 0,
        // Buat data salesData dari ordersData berdasarkan tanggal
        salesData: Object.keys(data.ordersByDate || {}).map(date => ({
          day: date,
          count: data.ordersByDate[date]?.length || 0
        })),
        // Buat data revenueData dari ordersData berdasarkan tanggal
        revenueData: Object.keys(data.ordersByDate || {}).map(date => ({
          day: date,
          amount: (data.ordersByDate[date] || []).reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0)
        })),
        // Tambahkan occupancyData berdasarkan tanggal (jika tersedia)
        occupancyData: data.occupancyByDate ? Object.keys(data.occupancyByDate || {}).map(date => ({
          day: date,
          percentage: data.occupancyByDate[date] || data.occupancyPercentage || 0
        })) : []
      };
      
      // Set sebagai weekly report untuk tampilan
      setReport({
        startDate: allReportData.salesData.length > 0 ? allReportData.salesData[0].day : "All Time",
        endDate: allReportData.salesData.length > 0 ? allReportData.salesData[allReportData.salesData.length - 1].day : "Report",
        ticketsSold: allReportData.ticketsSold,
        revenue: allReportData.revenue,
        occupancyPercentage: allReportData.occupancyPercentage || 0,
        salesData: allReportData.salesData,
        revenueData: allReportData.revenueData
      } as WeeklyReport);
      
      // Buat data tabel dari sales data
      if (allReportData.salesData.length > 0) {
        const tableRows = allReportData.salesData.map((item, index) => {
          // Cari occupancy untuk tanggal ini jika tersedia
          const dateOccupancy = allReportData.occupancyData && allReportData.occupancyData.length > 0
            ? allReportData.occupancyData.find(o => o.day === item.day)?.percentage
            : null;
            
          // Jika tidak ada tiket terjual, set persentase kursi terisi menjadi 0
          const seatsFilledPercent = item.count === 0 ? 0 : formatPercentage(dateOccupancy || data.occupancyPercentage || 0);
          
          return {
            id: index.toString(),
            date: item.day,
            ticketsSold: item.count,
            revenue: allReportData.revenueData[index]?.amount || 0,
            seatsFilledPercent: seatsFilledPercent
          };
        });
        
        // Pastikan tableData merefleksikan data yang difilter
        setTableData(tableRows);
        console.log('Table data set with rows:', tableRows.length, 'for all reports');
      } else {
        // Fallback jika tidak ada data tanggal
        setTableData([{
          id: "1",
          date: "All Time",
          ticketsSold: allReportData.ticketsSold,
          revenue: allReportData.revenue,
          seatsFilledPercent: allReportData.ticketsSold === 0 ? 0 : formatPercentage(allReportData.occupancyPercentage || 0)
        }]);
        console.log('Table data set with single row fallback for all reports');
      }
    } else {
      console.log('Processing standard report format', reportType);
      
      // Pastikan data tersedia sebelum memproses
      if (!data.ticketsSold && !data.revenue && !data.occupancyPercentage) {
        console.warn('Invalid report data format:', data);
        setNoDataMessage("No valid data available. Please try different filters.");
        setReport(null);
        setTableData([]);
        return;
      }
      
      // Proses untuk format report normal
      setReport(data);
      
      if (reportType === "daily") {
        const dailyData = data as DailyReport;
        
        // Untuk laporan harian, buat baris tunggal
        const tableData = [{
          id: "1",
          date: dailyData.date,
          ticketsSold: dailyData.ticketsSold || 0,
          revenue: dailyData.revenue || 0,
          seatsFilledPercent: dailyData.ticketsSold === 0 ? 0 : formatPercentage(dailyData.occupancyPercentage || 0)
        }];
        
        setTableData(tableData);
        console.log('Table data set for daily report:', tableData);
      } else if (reportType === "weekly") {
        const weeklyData = data as WeeklyReport;
        
        // Pastikan ada salesData sebelum memproses
        if (!weeklyData.salesData || weeklyData.salesData.length === 0) {
          console.warn('No sales data for weekly report:', weeklyData);
          
          // Buat satu baris dengan total data
          const tableData = [{
            id: "1",
            date: `${weeklyData.startDate} - ${weeklyData.endDate}`,
            ticketsSold: weeklyData.ticketsSold || 0,
            revenue: weeklyData.revenue || 0,
            seatsFilledPercent: weeklyData.ticketsSold === 0 ? 0 : formatPercentage(weeklyData.occupancyPercentage || 0)
          }];
          
          setTableData(tableData);
          console.log('Table data set with single row for weekly report without sales data');
          return;
        }
        
        // Buat data tabel dari sales data per hari
        const tableRows = weeklyData.salesData.map((item, index) => {
          // Cek jika ada data occupancy harian dalam respons API
          const dailyOccupancy = data.occupancyByDay 
            ? data.occupancyByDay[item.day] 
            : weeklyData.occupancyPercentage;
            
          // Jika tidak ada tiket terjual, set persentase kursi terisi menjadi 0
          const seatsFilledPercent = item.count === 0 ? 0 : formatPercentage(dailyOccupancy || 0);
          
          return {
            id: index.toString(),
            date: item.day,
            ticketsSold: item.count || 0,
            revenue: weeklyData.revenueData[index]?.amount || 0,
            seatsFilledPercent: seatsFilledPercent
          };
        });
        
        setTableData(tableRows);
        console.log('Table data set for weekly report with rows:', tableRows.length);
      } else if (reportType === "monthly") {
        const monthlyData = data as MonthlyReport;
        
        // Pastikan ada salesData sebelum memproses
        if (!monthlyData.salesData || monthlyData.salesData.length === 0) {
          console.warn('No sales data for monthly report:', monthlyData);
          
          // Buat satu baris dengan total data
          const tableData = [{
            id: "1",
            date: `${monthlyData.year}-${monthlyData.month.toString().padStart(2, '0')}`,
            ticketsSold: monthlyData.ticketsSold || 0,
            revenue: monthlyData.revenue || 0,
            seatsFilledPercent: monthlyData.ticketsSold === 0 ? 0 : formatPercentage(monthlyData.occupancyPercentage || 0)
          }];
          
          setTableData(tableData);
          console.log('Table data set with single row for monthly report without sales data');
          return;
        }
        
        // Buat data tabel dari sales data per hari dalam bulan
        const tableRows = monthlyData.salesData.map((item, index) => {
          const dateString = `${monthlyData.year}-${monthlyData.month.toString().padStart(2, '0')}-${item.day.toString().padStart(2, '0')}`;
          // Cek jika ada data occupancy harian dalam respons API
          const dailyOccupancy = data.occupancyByDay 
            ? data.occupancyByDay[dateString] || data.occupancyByDay[item.day.toString()]
            : monthlyData.occupancyPercentage;
            
          // Jika tidak ada tiket terjual, set persentase kursi terisi menjadi 0
          const seatsFilledPercent = item.count === 0 ? 0 : formatPercentage(dailyOccupancy || 0);
          
          return {
            id: index.toString(),
            date: dateString,
            ticketsSold: item.count || 0,
            revenue: monthlyData.revenueData[index]?.amount || 0,
            seatsFilledPercent: seatsFilledPercent
          };
        });
        
        setTableData(tableRows);
        console.log('Table data set for monthly report with rows:', tableRows.length);
      }
    }
  };

  // Donut data for Occupancy
  const getOccupancyData = () => {
    if (!report) return [];
    
    // Jika tidak ada tiket terjual, tampilkan 0%
    const occupancy = report.ticketsSold === 0 ? 0 : report.occupancyPercentage;
    return [
      { name: 'Occupied', value: formatPercentage(occupancy), fill: THEME_COLORS.primary },
      { name: 'Available', value: formatPercentage(100 - occupancy), fill: THEME_COLORS.lightGray }
    ];
  };

  // Prepare data for RadialBar chart
  const getRadialData = () => {
    if (!report) return [];
    
    // Jika tidak ada tiket terjual, tampilkan 0%
    const occupancy = report.ticketsSold === 0 ? 0 : report.occupancyPercentage;
    
    return [
      {
        name: 'Occupancy',
        value: formatPercentage(occupancy),
        fill: THEME_COLORS.primary
      }
    ];
  };

  const getReportTypeLabel = () => {
    switch(reportType) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'all':
        return 'All Reports';
      default:
        return 'Report';
    }
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const toggleTable = () => {
    setShowTable(!showTable);
    
    // Saat membuka tabel, pastikan data sudah sesuai dengan filter saat ini
    if (!showTable && report) {
      console.log('Table toggled to show with current data:', { 
        filter: { reportType, selectedEvent },
        rowCount: tableData.length
      });
    }
  };

  // Komponen untuk tabel detail
  const DetailedDataTable = () => {
    // Jika tidak ada data, tampilkan pesan
    if (!report || tableData.length === 0) {
      return (
        <div className="p-4 text-center text-sm text-gray-500">
          No detailed data available for the current filters.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto overflow-y-auto max-h-64">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets Sold</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seats Filled</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tableData.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">{row.date}</td>
                <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">{row.ticketsSold}</td>
                <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">{formatCurrency(row.revenue)}</td>
                <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">{row.seatsFilledPercent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Pastikan data konsisten saat awal render
  useEffect(() => {
    // Jika tidak ada data tabel, tapi ada report, coba load ulang data
    if (tableData.length === 0 && report) {
      console.log('Table data empty but report exists, processing report data again');
      processReportData(report);
    }
  }, [report, tableData]);
  
  // Pastikan filter yang tersimpan tetap konsisten
  useEffect(() => {
    // Log untuk debugging
    console.log('Current state:', {
      reportType,
      selectedEvent: selectedEvent,
      eventName: events.find(e => e.id === selectedEvent)?.name || 'All Events',
      tableDataCount: tableData.length,
      hasReport: report !== null
    });
  }, [reportType, selectedEvent, events, tableData, report]);

  return (
    <div className="min-h-screen flex flex-col bg-secondary">
      <Navbar />
      <div className="flex-grow container mx-auto px-4 py-6 mt-20">
        {/* Header dengan judul dan action buttons */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Analytic Reports</h1>
            <p className="text-sm text-gray-600 mt-1">View sales statistics and revenue for your events</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={toggleFilters}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-gray-700 flex items-center shadow-sm hover:bg-gray-50 transition-colors text-sm"
            >
              <FaFilter className="mr-1.5" />
              Filter
            </button>
            <button
              onClick={downloadReport}
              className="px-3 py-1.5 bg-gray-700 text-white rounded-md flex items-center shadow-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              disabled={loading}
            >
              <FaFileDownload className="mr-1.5" />
              Download Report
            </button>
          </div>
        </div>
        
        {/* Filter section - collapsible */}
        <div className={`bg-white rounded-lg shadow-md p-3 mb-4 transition-all duration-300 ${showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Report Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Report Type</label>
              <select
                className="border border-gray-300 rounded-md px-2 py-1.5 w-full bg-white shadow-sm text-sm focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as "daily" | "weekly" | "monthly" | "all")}
              >
                <option value="all">All Reports</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            {/* Event Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Event</label>
              <select
                className="border border-gray-300 rounded-md px-2 py-1.5 w-full bg-white shadow-sm text-sm focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition"
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
              >
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
              {selectedEvent !== "all" && (
                <p className="mt-1 text-xs text-blue-600">
                  Showing data for selected event only
                </p>
              )}
            </div>
            
            {/* Date Picker (tidak ditampilkan untuk weekly report dan all report) */}
            {reportType !== "weekly" && reportType !== "all" && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <FaCalendarAlt className="text-gray-400 text-xs" />
                  </div>
                  <input
                    type="date"
                    className="pl-7 border border-gray-300 rounded-md px-2 py-1.5 w-full bg-white shadow-sm text-sm focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* No data message */}
        {!loading && !error && (noDataMessage || !report) && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 p-4 mb-4 rounded-lg flex items-center justify-center shadow-sm">
            <div className="flex flex-col items-center text-center">
              <svg className="w-8 h-8 mb-3 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <p className="text-sm font-medium">{noDataMessage || "No data available for the selected period"}</p>
              <p className="mt-1 text-xs">Please select a different date or time period</p>
            </div>
          </div>
        )}
        
        {/* Loading indicator */}
        {loading && (
          <div className="w-full flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-secondary mb-2"></div>
            <p className="text-sm text-gray-600">
              {selectedEvent !== "all" 
                ? `Loading data for "${events.find(e => e.id === selectedEvent)?.name || 'selected event'}"...` 
                : "Loading report data..."}
            </p>
          </div>
        )}
        
        {/* Report content */}
        {!loading && report && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white rounded-lg shadow-md p-4 border-t-4 border-blue-500 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-500 text-xs font-medium">Total Tickets Sold</h3>
                    <p className="text-xl font-bold text-gray-800 mt-1">{report.ticketsSold}</p>
                  </div>
                  <div className="bg-blue-100 p-2 rounded-full">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path>
                    </svg>
                  </div>
                </div>
                <div className="mt-1">
                  <span className="text-xs text-gray-500">{getReportTypeLabel()} | {
                    reportType === 'weekly' 
                      ? ((report as WeeklyReport).startDate && (report as WeeklyReport).endDate 
                      ? (report as WeeklyReport).startDate + ' - ' + (report as WeeklyReport).endDate
                        : 'All Time')
                      : reportType === 'monthly'
                        ? ((report as MonthlyReport).year !== undefined && (report as MonthlyReport).month !== undefined 
                          ? `${(report as MonthlyReport).year}-${(report as MonthlyReport).month.toString().padStart(2, '0')}`
                          : 'All Time Report')
                        : (report as DailyReport).date || 'All Time'
                  }</span>
                  {selectedEvent !== "all" && (
                    <span className="block text-xs font-medium text-blue-600 mt-1">
                      {events.find(e => e.id === selectedEvent)?.name || 'Selected Event'}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-4 border-t-4 border-green-500 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-500 text-xs font-medium">Total Revenue</h3>
                    <p className="text-xl font-bold text-gray-800 mt-1">{formatCurrency(report.revenue)}</p>
                  </div>
                  <div className="bg-green-100 p-2 rounded-full">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                </div>
                <div className="mt-1">
                  <span className="text-xs text-gray-500">{getReportTypeLabel()} | {selectedEvent === "all" ? "All Events" : events.find(e => e.id === selectedEvent)?.name || "Selected Event"}</span>
                  {selectedEvent !== "all" && (
                    <span className="block text-xs font-medium text-blue-600 mt-1">
                      Filtered data for one event only
                    </span>
                  )}
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-4 border-t-4 border-purple-500 hover:shadow-lg transition-shadow"
                   style={{ borderTopColor: THEME_COLORS.primary }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-500 text-xs font-medium">Seat Occupancy</h3>
                    <p className="text-xl font-bold text-gray-800 mt-1">{report.ticketsSold === 0 ? "0" : formatPercentage(report.occupancyPercentage)}%</p>
                  </div>
                  <div className="p-2 rounded-full" style={{ backgroundColor: `${THEME_COLORS.primary}20` }}>
                    <svg className="w-5 h-5" style={{ color: THEME_COLORS.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                </div>
                <div className="mt-1">
                  <span className="text-xs text-gray-500">{getReportTypeLabel()} | Avg. Seats Filled</span>
                </div>
              </div>
            </div>
            
            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {/* Modern Bar Chart - Ticket Sales */}
              <div className="bg-white rounded-lg shadow-md p-3 col-span-1 md:col-span-1 hover:shadow-lg transition-shadow">
                <h3 className="text-sm font-medium mb-2" style={{ color: THEME_COLORS.darkText }}>Ticket Sales</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={
                        reportType === "daily" 
                          ? (report as DailyReport).salesData.map(item => ({ name: `${item.hour}:00`, value: item.count }))
                          : reportType === "weekly"
                            ? (report as WeeklyReport).salesData.map(item => ({ name: item.day, value: item.count }))
                            : (report as MonthlyReport).salesData.map(item => ({ name: `${item.day}`, value: item.count }))
                      }
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                      barSize={20}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f7" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 10, fill: THEME_COLORS.lightText }} 
                        tickLine={false}
                        axisLine={{ stroke: '#EAEAFA' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 10, fill: THEME_COLORS.lightText }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(242, 242, 255, 0.5)' }}
                        content={<CustomTooltip />}
                      />
                      <defs>
                        <linearGradient id="ticketGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={getGradientColors('tickets')[0]} stopOpacity={1} />
                          <stop offset="100%" stopColor={getGradientColors('tickets')[1]} stopOpacity={1} />
                        </linearGradient>
                      </defs>
                      <Bar 
                        dataKey="value" 
                        name="Tickets" 
                        fill="url(#ticketGradient)" 
                        radius={[4, 4, 0, 0]}
                        animationDuration={800}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Modern Area Chart - Revenue */}
              <div className="bg-white rounded-lg shadow-md p-3 col-span-1 md:col-span-1 hover:shadow-lg transition-shadow">
                <h3 className="text-sm font-medium mb-2" style={{ color: THEME_COLORS.darkText }}>Revenue</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={
                        reportType === "daily" 
                          ? (report as DailyReport).revenueData.map(item => ({ name: `${item.hour}:00`, value: item.amount }))
                          : reportType === "weekly"
                            ? (report as WeeklyReport).revenueData.map(item => ({ name: item.day, value: item.amount }))
                            : (report as MonthlyReport).revenueData.map(item => ({ name: `${item.day}`, value: item.amount }))
                      }
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f7" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 10, fill: THEME_COLORS.lightText }} 
                        tickLine={false}
                        axisLine={{ stroke: '#EAEAFA' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 10, fill: THEME_COLORS.lightText }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value as number), 'Revenue']}
                        content={<CustomTooltip formatter={(value: number) => formatCurrency(value)} />}
                      />
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={getGradientColors('revenue')[0]} stopOpacity={0.8} />
                          <stop offset="100%" stopColor={getGradientColors('revenue')[1]} stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        name="Revenue" 
                        stroke={THEME_COLORS.tertiary} 
                        fillOpacity={1}
                        fill="url(#revenueGradient)"
                        activeDot={{ r: 6, strokeWidth: 0, fill: THEME_COLORS.tertiary }}
                        animationDuration={800}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Modern Radial Bar Chart - Seat Occupancy - Fixed */}
              <div className="bg-white rounded-lg shadow-md p-3 col-span-1 md:col-span-2 xl:col-span-1 hover:shadow-lg transition-shadow">
                <h3 className="text-sm font-medium mb-2" style={{ color: THEME_COLORS.darkText }}>Seat Occupancy</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                      innerRadius="65%" 
                      outerRadius="85%" 
                      data={getRadialData()} 
                      startAngle={90} 
                      endAngle={-270}
                      barSize={10}
                    >
                      <RadialBar
                        background
                        dataKey="value"
                        cornerRadius={10}
                        fill={THEME_COLORS.primary}
                        animationDuration={800}
                      />
                      <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={THEME_COLORS.darkText}
                        style={{ 
                          fontSize: '24px', 
                          fontWeight: 'bold', 
                          fontFamily: 'sans-serif' 
                        }}
                      >
                        {report.ticketsSold === 0 ? "0" : formatPercentage(report.occupancyPercentage)}%
                      </text>
                      <text
                        x="50%"
                        y="60%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={THEME_COLORS.lightText}
                        style={{ 
                          fontSize: '10px', 
                          fontFamily: 'sans-serif' 
                        }}
                      >
                        Occupancy
                      </text>
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* Table section with toggle */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div 
                className="p-3 border-b cursor-pointer flex justify-between items-center hover:bg-gray-50"
                onClick={toggleTable}
              >
                <div className="flex items-center">
                  <FaTable className="mr-2 text-gray-600 text-sm" style={{ color: THEME_COLORS.primary }} />
                  <h3 className="text-sm font-medium" style={{ color: THEME_COLORS.darkText }}>Detailed Data</h3>
                </div>
                <div>
                  <svg 
                    className={`w-4 h-4 text-gray-600 transform transition-transform ${showTable ? 'rotate-180' : ''}`} 
                    style={{ color: THEME_COLORS.primary }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
              
              <div className={`transition-all duration-300 ${showTable ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <DetailedDataTable />
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default function ReportsPage() {
  return (
    <ProtectedRoute requiredRole="eventOrganizer">
      <ReportPageContent />
    </ProtectedRoute>
  );
} 