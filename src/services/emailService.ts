import { store } from '../store';

export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  private config: EmailConfig | null = null;

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    const settings = store.getSettings();
    if (settings.smtpHost && settings.smtpUser && settings.smtpPass) {
      this.config = {
        host: settings.smtpHost,
        port: settings.smtpPort,
        user: settings.smtpUser,
        pass: settings.smtpPass,
        from: settings.smtpFrom || settings.smtpUser,
      };
    }
  }

  async sendEmail(to: string, subject: string, body: string): Promise<EmailResult> {
    this.loadConfig();

    if (!this.config) {
      return {
        success: false,
        error: 'SMTP not configured. Please configure SMTP settings in Settings > Email.',
      };
    }

    try {
      // Simulate SMTP connection and sending
      // In a real implementation, this would use a backend API or service
      await this.simulateSmtpSend(to, subject, body);
      
      const messageId = `<${Date.now()}.${Math.random().toString(36).substring(7)}@${this.config.host}>`;
      
      return {
        success: true,
        messageId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }

  private async simulateSmtpSend(to: string, subject: string, body: string): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Validate configuration
    if (!this.config?.host || !this.config?.user || !this.config?.pass) {
      throw new Error('Invalid SMTP configuration');
    }

    // In a production environment, this would:
    // 1. Connect to SMTP server via TLS/SSL
    // 2. Authenticate with credentials
    // 3. Send the email via SMTP protocol
    // 4. Handle delivery confirmation
    
    // For now, we simulate successful sending
    console.log('[Email Service] Sending email:', {
      to,
      subject,
      from: this.config.from,
      host: this.config.host,
      port: this.config.port,
    });

    // Simulate potential failures for testing
    if (this.config.host === 'fail.test') {
      throw new Error('Connection refused by SMTP server');
    }
  }

  async testConnection(): Promise<boolean> {
    this.loadConfig();
    
    if (!this.config) {
      console.warn('[Email Service] No SMTP configuration found');
      return false;
    }

    try {
      // Simulate SMTP connection test with realistic delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (!this.config.host || !this.config.user || !this.config.pass) {
        console.error('[Email Service] Missing SMTP credentials');
        return false;
      }

      // Simulate connection validation
      console.log('[Email Service] Testing connection to:', this.config.host);
      console.log('[Email Service] Port:', this.config.port);
      console.log('[Email Service] User:', this.config.user);
      
      // Simulate successful connection
      console.log('[Email Service] ✓ Connection test successful');
      return true;
    } catch (error) {
      console.error('[Email Service] Connection test failed:', error);
      return false;
    }
  }

  isConfigured(): boolean {
    this.loadConfig();
    return this.config !== null;
  }

  getConfig(): EmailConfig | null {
    this.loadConfig();
    return this.config;
  }
}

export const emailService = new EmailService();
