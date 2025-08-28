export interface Location {
  id: string;
  business_id: string;
  name: string;
  address: string;
  city: string;
  contact_info: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface LocationRequest {
  name: string;
  address: string;
  city: string;
  contact_info: string;
  timezone: string;
}