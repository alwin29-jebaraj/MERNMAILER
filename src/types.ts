export interface EmailLog {
  email: string;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
}

export interface EmailRecord {
  id: string;
  subject: string;
  body: string;
  recipients: string[];
  sentAt: string;
  status: 'DRAFT' | 'SENDING' | 'COMPLETED' | 'FAILED';
  successCount: number;
  failedCount: number;
  logs: EmailLog[];
  previewUrl?: string;
  smtpHost?: string;
  isAiGenerated?: boolean;
  aiPrompt?: string;
}

export interface BulkMailStats {
  totalSent: number;
  successRate: number;
  queued: number;
  failed: number;
}

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromAddress: string;
}

export interface AdminSettings {
  smtpConfig?: SMTPConfig;
  useCustomSmtp: boolean;
  adminPasswordHash?: string;
}
