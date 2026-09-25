export type UserRole = 'BUSINESS_USER' | 'LMO' | 'GATC' | 'SUPERVISOR' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  organization_id?: string;
  is_active: boolean;
}

export interface Organization {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  gstin?: string;
  contact_email?: string;
  created_at: string;
}

export type InstrumentStatus = 'REGISTERED' | 'ACTIVE' | 'VERIFICATION_DUE' | 'VERIFIED' | 'SUSPENDED' | 'CONDEMNED';
export type InstrumentType = 'ELECTRONIC_WEIGHING' | 'NON_AUTOMATIC_WEIGHING' | 'FUEL_DISPENSER' | 'FLOW_METER';

export interface Instrument {
  id: string;
  passport_id: string;
  organization_id: string;
  instrument_type: InstrumentType;
  manufacturer: string;
  model: string;
  serial_number: string;
  capacity: number;
  capacity_unit: string;
  manufacture_year?: number;
  purchase_date?: string;
  location_description?: string;
  status: InstrumentStatus;
  current_certificate_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CertificateBrief {
  id: string;
  certificate_number: string;
  valid_from: string;
  valid_until: string;
  status: string;
  issued_at: string;
  qr_token: string;
  pdf_storage_path?: string;
}

export interface ApplicationBrief {
  id: string;
  application_number: string;
  application_type: string;
  status: string;
  submitted_at?: string;
  authorized_at?: string;
  created_at: string;
}

export interface InstrumentPassport extends Instrument {
  organization?: Organization;
  current_certificate?: CertificateBrief;
  recent_applications: ApplicationBrief[];
  historical_certificates: CertificateBrief[];
}

export type ApplicationStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type ApplicationType = 'INITIAL' | 'RENEWAL' | 'COMPLAINT';

export interface Application {
  id: string;
  application_number: string;
  instrument_id: string;
  applicant_id: string;
  application_type: ApplicationType;
  status: ApplicationStatus;
  purpose?: string;
  notes?: string;
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by_id?: string;
  authorized_at?: string;
  authorized_by_id?: string;
  created_at: string;
  updated_at: string;
  instrument?: Instrument;
  applicant?: User;
  reviewed_by?: User;
  authorized_by?: User;
}

export type AssignmentStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Assignment {
  id: string;
  application_id: string;
  assigned_officer_id: string;
  assigned_by_id: string;
  scheduled_date: string;
  scheduled_time_slot?: string;
  location_note?: string;
  status: AssignmentStatus;
  created_at: string;
  updated_at: string;
  assigned_officer?: User;
  assigned_by?: User;
}

export type VerificationStatus = 'DRAFT' | 'VALIDATED' | 'SUBMITTED';

export interface RuleResultItem {
  rule_code: string;
  description: string;
  severity: 'ERROR' | 'WARNING';
  status: 'PASS' | 'FAIL';
  detail?: string | null;
}

export interface RuleValidationResult {
  passed: boolean;
  error_count: number;
  warning_count: number;
  evaluated_at: string;
  rule_set_id?: string;
  rule_set_version?: string;
  results: RuleResultItem[];
}

export interface Evidence {
  id: string;
  verification_id: string;
  original_filename: string;
  stored_filename: string;
  storage_path: string;
  file_size_bytes: number;
  mime_type: string;
  file_type: 'IMAGE' | 'PDF' | 'VIDEO';
  description?: string;
  captured_at?: string;
  uploaded_at: string;
  uploader_id?: string;
  download_url?: string;
}

export interface Verification {
  id: string;
  assignment_id: string;
  application_id: string;
  officer_id: string;
  started_at: string;
  completed_at?: string;
  latitude?: number;
  longitude?: number;
  location_captured_at?: string;
  checklist_data: Record<string, any>;
  measurement_data: Record<string, any>;
  officer_remarks?: string;
  rule_validation_result?: RuleValidationResult;
  rule_validated_at?: string;
  status: VerificationStatus;
  created_at: string;
  updated_at: string;
  officer?: User;
  evidence: Evidence[];
}

export interface Certificate {
  id: string;
  certificate_number: string;
  application_id: string;
  instrument_id: string;
  verification_id: string;
  issued_by_id?: string;
  issued_at: string;
  valid_from: string;
  valid_until: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  qr_token: string;
  pdf_storage_path?: string;
  pdf_url?: string;
  certificate_data: Record<string, any>;
}

export interface PublicVerificationResponse {
  valid: boolean;
  certificate_number: string;
  status: string;
  instrument: {
    manufacturer: string;
    model: string;
    serial_number: string;
    capacity: number;
    capacity_unit: string;
    instrument_type: string;
    location_description?: string;
  };
  owner: {
    name: string;
    city?: string;
    state?: string;
  };
  issued_at: string;
  valid_from: string;
  valid_until: string;
  issued_by: string;
  qr_token: string;
  verification_url: string;
  disclaimer: string;
}

export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id?: string;
  actor_role?: string;
  details: Record<string, any>;
  ip_address?: string;
  timestamp: string;
}
