import { apiRequest } from './api.js'

// =======================
// Types (based on backend DTOs)
// =======================

export interface CreateScheduleTemplateRequest {
  staff_id: string
  name: string
  description?: string
  is_default: boolean
  schedule: WeeklyScheduleTemplate
}

export interface WeeklyScheduleTemplate {
  monday: DayScheduleTemplate
  tuesday: DayScheduleTemplate
  wednesday: DayScheduleTemplate
  thursday: DayScheduleTemplate
  friday: DayScheduleTemplate
  saturday: DayScheduleTemplate
  sunday: DayScheduleTemplate
}

export interface DayScheduleTemplate {
  is_working_day: boolean
  start_time?: string
  end_time?: string
  break_start_time?: string
  break_end_time?: string
  shifts?: ShiftTemplate[]
}

export interface ShiftTemplate {
  start_time: string
  end_time: string
  break_start_time?: string
  break_end_time?: string
  shift_type: 'regular' | 'overtime'
}

export interface ScheduleTemplateResponse {
  id: string
  staff_id: string
  staff_name: string
  name: string
  description: string
  is_default: boolean
  schedule: WeeklyScheduleTemplate
  created_at: string
  updated_at: string
}

export interface CreateShiftRequest {
  staff_id: string
  shift_date: string
  start_time: string
  end_time: string
  break_start_time?: string
  break_end_time?: string
  shift_type: 'regular' | 'overtime' | 'holiday' | 'emergency'
  notes?: string
  created_by: string
}

export interface UpdateShiftRequest {
  start_time?: string
  end_time?: string
  break_start_time?: string
  break_end_time?: string
  shift_type?: 'regular' | 'overtime' | 'holiday' | 'emergency'
  notes?: string
  is_available?: boolean
  updated_by: string
}

export interface ShiftResponse {
  id: string
  staff_id: string
  staff_name: string
  shift_date: string
  start_time: string
  end_time: string
  break_start_time?: string
  break_end_time?: string
  is_available: boolean
  is_manually_disabled: boolean
  manual_disable_reason?: string
  shift_type: string
  notes?: string
  created_by?: string
  updated_by?: string
  created_at: string
  updated_at: string
}

export interface CreateTimeOffRequest {
  staff_id: string
  start_date: string
  end_date: string
  type: 'vacation' | 'sick_leave' | 'personal_day' | 'emergency'
  reason: string
  is_half_day: boolean
  half_day_type?: 'morning' | 'afternoon'
  requested_by: string
}

export interface TimeOffResponse {
  id: string
  staff_id: string
  staff_name: string
  start_date: string
  end_date: string
  type: string
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  is_half_day: boolean
  half_day_type?: string
  requested_by: string
  approved_by?: string
  comments?: string
  requested_at: string
  processed_at?: string
}

export interface WeeklyScheduleViewResponse {
  week_start_date: string
  week_end_date: string
  staff_schedules: StaffWeeklyScheduleResponse[]
}

export interface StaffWeeklyScheduleResponse {
  staff_id: string
  staff_name: string
  position: string
  days: Record<string, DayScheduleResponse>
  total_hours: number
  time_off?: TimeOffResponse[]
}

export interface DayScheduleResponse {
  date: string
  day_of_week: string
  is_working_day: boolean
  shifts: ShiftResponse[]
  total_hours: number
  has_time_off: boolean
  time_off_reason?: string
}

export interface ScheduleStatsResponse {
  staff_id: string
  staff_name: string
  period: string
  total_working_days: number
  total_working_hours: number
  total_overtime_hours: number
  vacation_days: number
  sick_leave_days: number
  average_hours_per_day: number
  utilization_rate: number
}

// =======================
// API Service
// =======================

export class ScheduleService {
  private baseUrl: string

  constructor(businessId: string) {
    this.baseUrl = `/api/v1/businesses/${businessId}/schedule`
  }

  // =======================
  // Schedule Templates
  // =======================

  async createScheduleTemplate(data: CreateScheduleTemplateRequest): Promise<ScheduleTemplateResponse> {
    return apiRequest<ScheduleTemplateResponse>(`${this.baseUrl}/templates`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async getStaffScheduleTemplates(staffId: string): Promise<ScheduleTemplateResponse[]> {
    return apiRequest<ScheduleTemplateResponse[]>(`${this.baseUrl}/staff/${staffId}/templates`)
  }

  async getScheduleTemplate(templateId: string): Promise<ScheduleTemplateResponse> {
    return apiRequest<ScheduleTemplateResponse>(`${this.baseUrl}/templates/${templateId}`)
  }

  async updateScheduleTemplate(templateId: string, data: Partial<CreateScheduleTemplateRequest>): Promise<ScheduleTemplateResponse> {
    return apiRequest<ScheduleTemplateResponse>(`${this.baseUrl}/templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteScheduleTemplate(templateId: string): Promise<void> {
    return apiRequest<void>(`${this.baseUrl}/templates/${templateId}`, {
      method: 'DELETE'
    })
  }

  async setDefaultTemplate(staffId: string, templateId: string): Promise<void> {
    return apiRequest<void>(`${this.baseUrl}/staff/${staffId}/templates/${templateId}/set-default`, {
      method: 'POST'
    })
  }

  // =======================
  // Shifts Management
  // =======================

  async createShift(data: CreateShiftRequest): Promise<ShiftResponse> {
    return apiRequest<ShiftResponse>(`${this.baseUrl}/shifts`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async getShift(shiftId: string): Promise<ShiftResponse> {
    return apiRequest<ShiftResponse>(`${this.baseUrl}/shifts/${shiftId}`)
  }

  async updateShift(shiftId: string, data: UpdateShiftRequest): Promise<ShiftResponse> {
    return apiRequest<ShiftResponse>(`${this.baseUrl}/shifts/${shiftId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteShift(shiftId: string): Promise<void> {
    return apiRequest<void>(`${this.baseUrl}/shifts/${shiftId}`, {
      method: 'DELETE'
    })
  }

  async updateShiftAvailability(shiftId: string, isAvailable: boolean, reason?: string): Promise<void> {
    return apiRequest<void>(`${this.baseUrl}/shifts/${shiftId}/availability`, {
      method: 'PUT',
      body: JSON.stringify({ is_available: isAvailable, reason })
    })
  }

  async getStaffShifts(staffId: string, startDate?: string, endDate?: string): Promise<ShiftResponse[]> {
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return apiRequest<ShiftResponse[]>(`${this.baseUrl}/staff/${staffId}/shifts${query}`)
  }

  async generateStaffSchedule(staffId: string, data: {
    start_date: string
    end_date: string
    template_id?: string
    overwrite_existing?: boolean
  }): Promise<ShiftResponse[]> {
    return apiRequest<ShiftResponse[]>(`${this.baseUrl}/staff/${staffId}/shifts/generate`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // =======================
  // Schedule Views
  // =======================

  async getWeeklyScheduleView(weekStartDate: string, staffIds?: string[]): Promise<WeeklyScheduleViewResponse> {
    const params = new URLSearchParams()
    params.append('week_start_date', weekStartDate)
    if (staffIds && staffIds.length > 0) {
      staffIds.forEach(id => params.append('staff_ids', id))
    }
    
    return apiRequest<WeeklyScheduleViewResponse>(`${this.baseUrl}/views/weekly?${params.toString()}`)
  }

  async getMonthlyScheduleView(year: number, month: number, staffIds?: string[]): Promise<WeeklyScheduleViewResponse> {
    const params = new URLSearchParams()
    params.append('year', year.toString())
    params.append('month', month.toString())
    if (staffIds && staffIds.length > 0) {
      staffIds.forEach(id => params.append('staff_ids', id))
    }
    
    return apiRequest<WeeklyScheduleViewResponse>(`${this.baseUrl}/views/monthly?${params.toString()}`)
  }

  async getStaffWeeklySchedule(staffId: string, weekStartDate: string): Promise<StaffWeeklyScheduleResponse> {
    return apiRequest<StaffWeeklyScheduleResponse>(`${this.baseUrl}/views/staff/${staffId}/weekly?week_start_date=${weekStartDate}`)
  }

  async getStaffDaySchedule(staffId: string, date: string): Promise<DayScheduleResponse> {
    return apiRequest<DayScheduleResponse>(`${this.baseUrl}/views/staff/${staffId}/day?date=${date}`)
  }

  // =======================
  // Time Off Management
  // =======================

  async createTimeOffRequest(data: CreateTimeOffRequest): Promise<TimeOffResponse> {
    return apiRequest<TimeOffResponse>(`${this.baseUrl}/time-off`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async getTimeOffRequest(requestId: string): Promise<TimeOffResponse> {
    return apiRequest<TimeOffResponse>(`${this.baseUrl}/time-off/${requestId}`)
  }

  async updateTimeOffRequest(requestId: string, data: {
    status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
    approval_by?: string
    comments?: string
  }): Promise<TimeOffResponse> {
    return apiRequest<TimeOffResponse>(`${this.baseUrl}/time-off/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteTimeOffRequest(requestId: string): Promise<void> {
    return apiRequest<void>(`${this.baseUrl}/time-off/${requestId}`, {
      method: 'DELETE'
    })
  }

  async getStaffTimeOffRequests(staffId: string): Promise<TimeOffResponse[]> {
    return apiRequest<TimeOffResponse[]>(`${this.baseUrl}/time-off/staff/${staffId}`)
  }

  async getBusinessTimeOffRequests(): Promise<TimeOffResponse[]> {
    return apiRequest<TimeOffResponse[]>(`${this.baseUrl}/time-off/business`)
  }

  // =======================
  // Statistics
  // =======================

  async getStaffScheduleStats(staffId: string, period?: string): Promise<ScheduleStatsResponse> {
    const params = period ? `?period=${period}` : ''
    return apiRequest<ScheduleStatsResponse>(`${this.baseUrl}/stats/staff/${staffId}${params}`)
  }

  async getBusinessScheduleStats(period?: string): Promise<ScheduleStatsResponse[]> {
    const params = period ? `?period=${period}` : ''
    return apiRequest<ScheduleStatsResponse[]>(`${this.baseUrl}/stats/business${params}`)
  }

  // =======================
  // Quick Actions
  // =======================

  async quickEnableStaff(staffId: string, reason: string): Promise<void> {
    return apiRequest<void>(`${this.baseUrl}/quick-actions/staff/${staffId}/enable`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    })
  }

  async quickDisableStaff(staffId: string, reason: string): Promise<void> {
    return apiRequest<void>(`${this.baseUrl}/quick-actions/staff/${staffId}/disable`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    })
  }

  async copySchedule(data: {
    source_staff_id: string
    target_staff_id: string
    source_date: string
    target_date: string
    copy_days: number
    action_by: string
  }): Promise<void> {
    return apiRequest<void>(`${this.baseUrl}/quick-actions/copy-schedule`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // =======================
  // Availability
  // =======================

  async checkStaffAvailability(staffId: string, date: string, startTime: string, endTime: string): Promise<{
    is_available: boolean
    conflicts: string[]
    working_hours: { start: string, end: string }
  }> {
    const params = new URLSearchParams()
    params.append('date', date)
    params.append('start_time', startTime)
    params.append('end_time', endTime)
    
    return apiRequest(`${this.baseUrl}/availability/staff/${staffId}/check?${params.toString()}`)
  }

  async getAvailableStaff(date: string, startTime: string, endTime: string): Promise<{
    staff_id: string
    staff_name: string
    is_available: boolean
  }[]> {
    const params = new URLSearchParams()
    params.append('date', date)
    params.append('start_time', startTime)
    params.append('end_time', endTime)
    
    return apiRequest(`${this.baseUrl}/availability/available-staff?${params.toString()}`)
  }
}