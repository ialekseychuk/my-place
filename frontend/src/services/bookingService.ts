import type { Booking } from '@/types/booking';
import { apiRequest } from './api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:81'

export const bookingService = {
  /**
   * Get all bookings for a business with optional date filtering and location filtering
   * @param businessID - The business ID
   * @param startDate - Optional start date in YYYY-MM-DD format
   * @param endDate - Optional end date in YYYY-MM-DD format
   * @param locationId - Optional location ID to filter bookings
   * @returns Promise with array of bookings
   */
  getBookings: async (
    businessID: string,
    startDate?: string,
    endDate?: string,
    locationId?: string
  ): Promise<Booking[]> => {
    const params = new URLSearchParams();
    
    // Add date parameters if provided
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (locationId) params.append('location_id', locationId);
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    let url = `${API_BASE_URL}/api/v1/businesses/${businessID}/bookings${queryString}`;
    
    const result = await apiRequest<Booking[]>(url);
    
    // Filter the results on the client side if date parameters were provided
    // (keeping existing client-side filtering logic)
    let filteredResult = Array.isArray(result) ? result : [];
    
    if (startDate || endDate) {
      filteredResult = filteredResult.filter(booking => {
        const bookingDate = new Date(booking.start_at).toISOString().split('T')[0];
        
        // If only start date is provided, filter bookings on or after that date
        if (startDate && !endDate) {
          return bookingDate >= startDate;
        }
        
        // If only end date is provided, filter bookings on or before that date
        if (!startDate && endDate) {
          return bookingDate <= endDate;
        }
        
        // If both dates are provided, filter bookings between those dates
        if (startDate && endDate) {
          return bookingDate >= startDate && bookingDate <= endDate;
        }
        
        // If no date filters are provided, return all bookings
        return true;
      });
    }
    
    return filteredResult;
  }
}