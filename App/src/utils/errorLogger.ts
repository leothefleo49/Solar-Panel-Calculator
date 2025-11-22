/**
 * Comprehensive Error Logging System
 * 
 * Features:
 * - Captures all errors with detailed context
 * - Includes system info, API states, stack traces
 * - Provides debugging advice and recommendations
 * - Sends error reports via email (beta: after each run, production: Monday 2 AM)
 * - Stores logs locally for offline analysis
 */

import { isTauri } from '@tauri-apps/api/core';

export interface ErrorLog {
  id: string;
  timestamp: number;
  type: 'error' | 'warning' | 'info';
  category: 'api' | 'ui' | 'system' | 'network' | 'validation' | 'unknown';
  message: string;
  stack?: string;
  context: {
    // System information
    platform: string;
    appVersion: string;
    userAgent: string;
    screenResolution: string;
    memory?: {
      used: number;
      total: number;
    };
    
    // Application state
    currentRoute?: string;
    apiKeysConfigured: {
      unified: boolean;
      solar: boolean;
      maps: boolean;
      shopping: boolean;
      gemini: boolean;
      openai: boolean;
      anthropic: boolean;
      grok: boolean;
    };
    
    // API status
    activeApiCalls?: string[];
    lastApiError?: {
      provider: string;
      endpoint: string;
      statusCode?: number;
      errorMessage: string;
      timestamp: number;
    };
    
    // User action that triggered error
    userAction?: string;
    componentStack?: string;
  };
  
  // Debugging assistance
  debuggingAdvice: string[];
  suggestedFixes: string[];
  relatedCode?: string;
  
  // Email status
  emailSent?: boolean;
  emailSentAt?: number;
}

interface ErrorLoggerConfig {
  mode: 'beta' | 'production';
  emailEndpoint?: string;
  emailTo?: string;
  enableConsoleLogging: boolean;
  maxLogsStored: number;
  // Optional remote config URL to control reporting interval
  remoteConfigUrl?: string;
  // Optional static default reporting interval
  reportingInterval?: 'every_run' | 'hourly' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'disabled';
  // Email threading support
  emailThreadId?: string;
}

const EMAIL_THREAD_KEY = 'error-logger-thread-id';
const LAST_REPORT_KEY = 'error-logger-last-report';

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private config: ErrorLoggerConfig;
  private reportTimer: any = null;
  private currentRemoteConfig: { reportingInterval?: string } | null = null;
  
  constructor(config: Partial<ErrorLoggerConfig> = {}) {
    this.config = {
      mode: 'beta', // Default to beta mode for immediate error reports
      emailEndpoint: import.meta.env.VITE_ERROR_LOG_ENDPOINT || 'https://your-backend-endpoint.com/api/error-logs',
      emailTo: import.meta.env.VITE_ERROR_LOG_EMAIL || 'leothefleo49@gmail.com',
      // Optional: remote config URL that returns JSON { reportingInterval: 'daily' }
      remoteConfigUrl: import.meta.env.VITE_ERROR_LOG_CONFIG_URL,
      enableConsoleLogging: true,
      maxLogsStored: 1000,
      ...config,
    };
    
    // Log configuration status
    if (this.config.enableConsoleLogging) {
      console.log('🔧 Error Logger initialized:', {
        mode: this.config.mode,
        endpointConfigured: this.config.emailEndpoint?.startsWith('http') ? '✅' : '❌ (Set VITE_ERROR_LOG_ENDPOINT in .env)',
        emailTo: this.config.emailTo,
      });
    }
    
    this.loadLogsFromStorage();
    this.setupGlobalErrorHandlers();
    this.setupBeforeUnloadHandler();
    this.scheduleEmailReports();

    // If a remote config URL is provided, poll it periodically and adjust reporting interval
    if ((this.config as any).remoteConfigUrl) {
      // initial fetch
      void this.fetchRemoteConfig();
      // poll every 5 minutes for changes
      setInterval(() => void this.fetchRemoteConfig(), 5 * 60 * 1000);
    }
  }
  
  /**
   * Log an error with full context
   */
  async logError(
    message: string,
    error?: Error,
    category: ErrorLog['category'] = 'unknown',
    userAction?: string
  ): Promise<void> {
    const errorLog: ErrorLog = {
      id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: 'error',
      category,
      message,
      stack: error?.stack,
      context: await this.captureContext(userAction),
      debuggingAdvice: this.generateDebuggingAdvice(category, message, error),
      suggestedFixes: this.generateSuggestedFixes(category, message, error),
      relatedCode: this.extractRelatedCode(error),
    };
    
    this.addLog(errorLog);
    
    if (this.config.enableConsoleLogging) {
      console.error('🚨 ERROR LOGGED:', errorLog);
    }
    
    // In beta mode, send email immediately
    if (this.config.mode === 'beta') {
      await this.sendEmailReport([errorLog]);
    }
  }
  
  /**
   * Log a warning
   */
  async logWarning(message: string, category: ErrorLog['category'] = 'unknown'): Promise<void> {
    const warningLog: ErrorLog = {
      id: `warn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: 'warning',
      category,
      message,
      context: await this.captureContext(),
      debuggingAdvice: [],
      suggestedFixes: [],
    };
    
    this.addLog(warningLog);
    
    if (this.config.enableConsoleLogging) {
      console.warn('⚠️ WARNING LOGGED:', warningLog);
    }
  }
  
  /**
   * Log informational message
   */
  async logInfo(message: string, category: ErrorLog['category'] = 'unknown'): Promise<void> {
    const infoLog: ErrorLog = {
      id: `info-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: 'info',
      category,
      message,
      context: await this.captureContext(),
      debuggingAdvice: [],
      suggestedFixes: [],
    };
    
    this.addLog(infoLog);
  }
  
  /**
   * Capture comprehensive system and app context
   */
  private async captureContext(userAction?: string): Promise<ErrorLog['context']> {
    // Get API key configuration status (without exposing keys)
    const getApiKeyStatus = () => {
      try {
        const googleStore = localStorage.getItem('google-api-storage');
        const chatStore = localStorage.getItem('chat-storage');
        
        const googleData = googleStore ? JSON.parse(googleStore) : {};
        const chatData = chatStore ? JSON.parse(chatStore) : {};
        
        return {
          unified: !!googleData.state?.apiKeys?.unified,
          solar: !!googleData.state?.apiKeys?.solar,
          maps: !!googleData.state?.apiKeys?.maps,
          shopping: !!googleData.state?.apiKeys?.shopping,
          gemini: !!chatData.state?.providerKeys?.google,
          openai: !!chatData.state?.providerKeys?.openai,
          anthropic: !!chatData.state?.providerKeys?.anthropic,
          grok: !!chatData.state?.providerKeys?.grok,
        };
      } catch {
        return {
          unified: false,
          solar: false,
          maps: false,
          shopping: false,
          gemini: false,
          openai: false,
          anthropic: false,
          grok: false,
        };
      }
    };
    
    // Get memory info if available
    const getMemoryInfo = () => {
      if ('memory' in performance && (performance as any).memory) {
        const mem = (performance as any).memory;
        return {
          used: mem.usedJSHeapSize,
          total: mem.totalJSHeapSize,
        };
      }
      return undefined;
    };
    
    // Get app version
    const getAppVersion = async () => {
      if (isTauri()) {
        try {
          const { getVersion } = await import('@tauri-apps/api/app');
          return await getVersion();
        } catch {
          return 'unknown';
        }
      }
      return import.meta.env.VITE_APP_VERSION || '1.4.10';
    };
    
    return {
      platform: isTauri() ? 'desktop' : (window as any).Capacitor ? 'android' : 'web',
      appVersion: await getAppVersion(),
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      memory: getMemoryInfo(),
      currentRoute: window.location.pathname,
      apiKeysConfigured: getApiKeyStatus(),
      userAction,
    };
  }
  
  /**
   * Generate debugging advice based on error
   */
  private generateDebuggingAdvice(
    category: ErrorLog['category'],
    message: string,
    _error?: Error
  ): string[] {
    const advice: string[] = [];
    
    // API-specific advice
    if (category === 'api') {
      advice.push('Check if the API key is valid and has proper permissions');
      advice.push('Verify that the API is enabled in the provider console');
      advice.push('Ensure network connectivity is stable');
      
      if (message.includes('CORS')) {
        advice.push('CORS error detected: The API endpoint is blocking requests from this origin');
        advice.push('Solution: Add your domain to the API key restrictions (HTTP referrers) in Google Cloud Console');
        advice.push('For desktop: CORS restrictions may not apply, but check API key restrictions');
        advice.push('Code Hint: Ensure your fetch request includes mode: "cors" if needed, or use a proxy.');
      }
      
      if (message.includes('401') || message.includes('403')) {
        advice.push('Authentication error: API key may be invalid, expired, or lacks permissions');
        advice.push('Solution: Generate a new API key and ensure all required APIs are enabled');
        advice.push('Check: Did you enable "Solar API", "Maps JavaScript API", "Geocoding API"?');
      }
      
      if (message.includes('429')) {
        advice.push('Rate limit exceeded: Too many requests in a short time');
        advice.push('Solution: Wait a few minutes, or upgrade your API plan for higher limits');
        advice.push('Tip: Implement exponential backoff in your retry logic.');
      }
      
      if (message.includes('500') || message.includes('502') || message.includes('503')) {
        advice.push('Server error: The API provider is experiencing issues');
        advice.push('Solution: This is not your fault. Wait and retry in a few minutes');
      }
      
      if (message.includes('Failed to fetch')) {
        advice.push('Network error: Request could not be completed');
        advice.push('Possible causes: No internet connection, API endpoint blocked, or CORS issue');
        advice.push('Solution: Check your internet connection and firewall settings');
        advice.push('Debug: Try accessing the API endpoint directly in your browser to check connectivity.');
      }
    }
    
    // Network-specific advice
    if (category === 'network') {
      advice.push('Check your internet connection');
      advice.push('Verify that firewall/antivirus is not blocking requests');
      advice.push('Try using a different network (e.g., mobile hotspot)');
    }
    
    // Validation errors
    if (category === 'validation') {
      advice.push('Input validation failed: Check that all required fields are filled');
      advice.push('Ensure data formats are correct (e.g., email, phone number)');
    }
    
    // UI errors
    if (category === 'ui') {
      advice.push('UI component error: Try refreshing the page');
      advice.push('Check browser console for additional errors');
      advice.push('Ensure browser is up to date');
    }
    
    return advice;
  }
  
  /**
   * Generate suggested fixes
   */
  private generateSuggestedFixes(
    category: ErrorLog['category'],
    message: string,
    error?: Error
  ): string[] {
    const fixes: string[] = [];
    
    if (category === 'api') {
      fixes.push('Go to Settings > APIs tab and verify all keys are correctly configured');
      fixes.push('Click "Test Connection" button (if available) to validate API keys');
      fixes.push('Try regenerating API keys in the provider console');
    }
    
    if (message.includes('undefined') || message.includes('null')) {
      fixes.push('Possible missing data: Ensure all required configuration is set');
      fixes.push('Try resetting the app configuration to defaults');
    }
    
    if (error?.stack?.includes('fetch')) {
      fixes.push('Network request failed: Check API endpoint URLs in code');
      fixes.push('Verify that API services are not down (check status pages)');
    }
    
    return fixes;
  }
  
  /**
   * Extract related code from error stack
   */
  private extractRelatedCode(error?: Error): string | undefined {
    if (!error?.stack) return undefined;
    
    // Extract file and line numbers from stack trace
    const stackLines = error.stack.split('\n').slice(0, 5);
    return stackLines.join('\n');
  }
  
  /**
   * Add log to storage
   */
  private addLog(log: ErrorLog): void {
    this.logs.push(log);
    
    // Limit stored logs
    if (this.logs.length > this.config.maxLogsStored) {
      this.logs = this.logs.slice(-this.config.maxLogsStored);
    }
    
    this.saveLogsToStorage();
  }
  
  /**
   * Save logs to persistent storage
   */
  private saveLogsToStorage(): void {
    try {
      localStorage.setItem('error-logs', JSON.stringify(this.logs));
    } catch (e) {
      console.error('Failed to save error logs to storage:', e);
    }
  }
  
  /**
   * Load logs from persistent storage
   */
  private loadLogsFromStorage(): void {
    try {
      const stored = localStorage.getItem('error-logs');
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load error logs from storage:', e);
    }
  }
  
  /**
   * Get all logs
   */
  getLogs(filter?: { type?: ErrorLog['type']; category?: ErrorLog['category']; since?: number }): ErrorLog[] {
    let filtered = this.logs;
    
    if (filter) {
      if (filter.type) {
        filtered = filtered.filter(log => log.type === filter.type);
      }
      if (filter.category) {
        filtered = filtered.filter(log => log.category === filter.category);
      }
      if (filter.since !== undefined) {
        filtered = filtered.filter(log => log.timestamp >= filter.since!);
      }
    }
    
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }
  
  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    this.saveLogsToStorage();
  }
  
  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      this.logError(
        event.message,
        event.error,
        'unknown',
        'Unhandled error event'
      );
    });
    
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(
        `Unhandled promise rejection: ${event.reason}`,
        event.reason instanceof Error ? event.reason : undefined,
        'unknown',
        'Unhandled promise rejection'
      );
    });
  }
  
  /**
   * Setup beforeunload handler to send report on app close
   */
  private setupBeforeUnloadHandler(): void {
    const sendReportOnClose = () => {
      // Get logs since last report
      const lastReportTime = this.getLastReportTime();
      const newLogs = this.logs.filter(log => log.timestamp > lastReportTime);
      
      if (!this.config.emailEndpoint) {
        console.warn('⚠️ Error logger: No email endpoint configured. Set VITE_ERROR_LOG_ENDPOINT in .env file.');
        return;
      }
      
      if (!this.config.emailEndpoint.startsWith('http')) {
        console.warn('⚠️ Error logger: Invalid email endpoint. Please deploy webhook server and update .env');
        return;
      }
      
      // In beta mode, always send report (even if no errors)
      let logsToSend = newLogs.length > 0 ? newLogs : [];
      
      if (this.config.mode === 'beta' && logsToSend.length === 0) {
        // Create a session report log
        logsToSend = [{
          id: `session-${Date.now()}`,
          timestamp: Date.now(),
          type: 'info',
          category: 'system',
          message: 'App session ended - no errors encountered',
          context: {
            platform: 'unknown',
            appVersion: 'unknown',
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            apiKeysConfigured: {
              unified: false,
              solar: false,
              maps: false,
              shopping: false,
              gemini: false,
              openai: false,
              anthropic: false,
              grok: false,
            },
          },
          debuggingAdvice: [],
          suggestedFixes: [],
        } as ErrorLog];
      }
      
      if (logsToSend.length > 0) {
        // Try fetch with keepalive first (more reliable for JSON payloads than beacon sometimes)
        const payload = JSON.stringify({
          to: this.config.emailTo,
          subject: `Solar Panel Calculator - Session Report (${logsToSend.length} ${logsToSend.length === 1 ? 'issue' : 'issues'})`,
          body: report,
          logs: logsToSend,
          threadId: this.getEmailThreadId(),
        });

        const blob = new Blob([payload], { type: 'application/json' });
        
        // Try fetch with keepalive
        fetch(this.config.emailEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).then(res => {
          if (res.ok) {
            console.log(`✅ Error report sent via fetch/keepalive (${logsToSend.length} logs)`);
            this.updateLastReportTime();
          } else {
            // Fallback to beacon
            if (navigator.sendBeacon) {
               navigator.sendBeacon(this.config.emailEndpoint!, blob);
            }
          }
        }).catch(() => {
           // Fallback to beacon
           if (navigator.sendBeacon) {
              navigator.sendBeacon(this.config.emailEndpoint!, blob);
           }
        });
      }
    };

    // Handle browser/web app close
    window.addEventListener('beforeunload', () => {
      sendReportOnClose();
    });
    
    // Also send on visibility change (when tab is closed or app goes to background)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        sendReportOnClose();
      }
    });
    
    // Handle Tauri app close
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      // Tauri apps: send report when window closes
      import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
        const win = getCurrentWindow();
        win.onCloseRequested(() => {
          sendReportOnClose();
        });
      }).catch(() => {
        // Tauri not available, already handled by beforeunload
      });
    }
  }
  
  /**
   * Get or create email thread ID for threading all reports together
   */
  private getEmailThreadId(): string {
    try {
      let threadId = localStorage.getItem(EMAIL_THREAD_KEY);
      if (!threadId) {
        // Generate unique thread ID: email-thread-{timestamp}-{random}
        threadId = `email-thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(EMAIL_THREAD_KEY, threadId);
      }
      return threadId;
    } catch {
      return `email-thread-${Date.now()}`;
    }
  }
  
  /**
   * Get timestamp of last sent report
   */
  private getLastReportTime(): number {
    try {
      const stored = localStorage.getItem(LAST_REPORT_KEY);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  }
  
  /**
   * Update last report timestamp
   */
  private updateLastReportTime(): void {
    try {
      localStorage.setItem(LAST_REPORT_KEY, Date.now().toString());
    } catch (e) {
      console.warn('Failed to update last report time:', e);
    }
  }
  
  /**
   * Schedule email reports based on mode
   */
  private scheduleEmailReports(): void {
    // Determine scheduling strategy from config.reportingInterval (supports remote override)
    const intervalMinutes = this.getIntervalMinutesFromConfig();
    if (intervalMinutes <= 0) return; // disabled or handled as immediate

    // Clear existing timer if set
    if (this.reportTimer) {
      clearInterval(this.reportTimer as any);
    }

    // Run immediately once, then on the configured interval
    void this.sendEmailReport(this.logs.slice(-100));
    this.reportTimer = setInterval(() => void this.sendEmailReport(this.logs.slice(-100)), intervalMinutes * 60 * 1000);
  }

  /**
   * Map configured interval to minutes.
   */
  private getIntervalMinutesFromConfig(): number {
    // Priority: remote config override -> build-time config -> default
    const remoteInterval = this.currentRemoteConfig?.reportingInterval as
      | 'every_run'
      | 'hourly'
      | 'daily'
      | 'weekly'
      | 'biweekly'
      | 'monthly'
      | 'disabled'
      | undefined;

    const cfgInterval = (this.config as any).reportingInterval as
      | 'every_run'
      | 'hourly'
      | 'daily'
      | 'weekly'
      | 'biweekly'
      | 'monthly'
      | 'disabled'
      | undefined;

    const interval = remoteInterval || cfgInterval || (this.config.mode === 'beta' ? 'every_run' : 'weekly');

    switch (interval) {
      case 'every_run':
        return 0; // handled as immediate
      case 'hourly':
        return 60;
      case 'daily':
        return 24 * 60;
      case 'weekly':
        return 7 * 24 * 60;
      case 'biweekly':
        return 14 * 24 * 60;
      case 'monthly':
        return 30 * 24 * 60;
      case 'disabled':
        return -1;
      default:
        return this.config.mode === 'beta' ? 0 : 7 * 24 * 60;
    }
  }

  /**
   * Fetch remote config JSON from configured URL and apply it.
   */
  private async fetchRemoteConfig(): Promise<void> {
    try {
      const url = (this.config as any).remoteConfigUrl;
      if (!url) return;

      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return;

      const json = await res.json();
      if (json && json.reportingInterval) {
        // normalize
        this.currentRemoteConfig = { reportingInterval: String(json.reportingInterval) };
        // Reschedule with new interval
        this.scheduleEmailReports();
      }
    } catch (e) {
      // Ignore transient errors
      if (this.config.enableConsoleLogging) console.debug('Remote config fetch failed', e);
    }
  }
  
  
  
  /**
   * Send error report via email
   */
  private async sendEmailReport(logs: ErrorLog[]): Promise<void> {
    if (!this.config.emailEndpoint) {
      console.warn('Email endpoint not configured. Skipping email report.');
      return;
    }
    
    try {
      const report = this.generateEmailReport(logs);
      
      // Add reply instructions so recipients can reply with commands to change reporting interval
      const replyInstructions = `\n\nReply with one of the following commands (in subject or body) to change the reporting interval:\n` +
        `- mode: every_run\n- mode: hourly\n- mode: daily\n- mode: weekly\n- mode: biweekly\n- mode: monthly\n` +
        `\nOr configure the remote controller (if available) at: ${(this.config as any).remoteConfigUrl || 'not configured'}`;

      const response = await fetch(this.config.emailEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: this.config.emailTo,
          subject: `Solar Panel Calculator - Error Report (${logs.length} issues)`,
          body: report + replyInstructions,
          logs: logs,
          threadId: this.getEmailThreadId(), // Add thread ID for email threading
        }),
      });
      
      if (response.ok) {
        // Mark logs as emailed
        logs.forEach(log => {
          log.emailSent = true;
          log.emailSentAt = Date.now();
        });
        this.saveLogsToStorage();
        this.updateLastReportTime();
        
        console.log(`✅ Error report sent successfully (${logs.length} logs)`);
      } else {
        console.error('Failed to send error report:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to send error report:', error);
    }
  }
  
  /**
   * Generate formatted email report
   */
  private generateEmailReport(logs: ErrorLog[]): string {
    const errorCount = logs.filter(l => l.type === 'error').length;
    const warningCount = logs.filter(l => l.type === 'warning').length;
    
    let report = `# Solar Panel Calculator - Error Report\n\n`;
    report += `**Generated:** ${new Date().toLocaleString()}\n`;
    report += `**Total Issues:** ${logs.length} (${errorCount} errors, ${warningCount} warnings)\n\n`;
    report += `---\n\n`;
    
    // Group by category
    const byCategory = logs.reduce((acc, log) => {
      if (!acc[log.category]) acc[log.category] = [];
      acc[log.category].push(log);
      return acc;
    }, {} as Record<string, ErrorLog[]>);
    
    Object.entries(byCategory).forEach(([category, categoryLogs]) => {
      report += `## ${category.toUpperCase()} Issues (${categoryLogs.length})\n\n`;
      
      categoryLogs.forEach((log, index) => {
        report += `### ${index + 1}. ${log.message}\n\n`;
        report += `- **Type:** ${log.type}\n`;
        report += `- **Time:** ${new Date(log.timestamp).toLocaleString()}\n`;
        report += `- **Platform:** ${log.context.platform}\n`;
        report += `- **App Version:** ${log.context.appVersion}\n`;
        
        if (log.context.userAction) {
          report += `- **User Action:** ${log.context.userAction}\n`;
        }
        
        if (log.stack) {
          report += `\n**Stack Trace:**\n\`\`\`\n${log.stack}\n\`\`\`\n`;
        }
        
        if (log.debuggingAdvice.length > 0) {
          report += `\n**Debugging Advice:**\n`;
          log.debuggingAdvice.forEach(advice => {
            report += `- ${advice}\n`;
          });
        }
        
        if (log.suggestedFixes.length > 0) {
          report += `\n**Suggested Fixes:**\n`;
          log.suggestedFixes.forEach(fix => {
            report += `- ${fix}\n`;
          });
        }
        
        report += `\n---\n\n`;
      });
    });
    
    return report;
  }
  
  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
  
  /**
   * Export logs as CSV
   */
  exportLogsAsCSV(): string {
    const headers = ['ID', 'Timestamp', 'Type', 'Category', 'Message', 'Platform', 'App Version'];
    const rows = this.logs.map(log => [
      log.id,
      new Date(log.timestamp).toISOString(),
      log.type,
      log.category,
      log.message,
      log.context.platform,
      log.context.appVersion,
    ]);
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }
}

// Singleton instance
export const errorLogger = new ErrorLogger({
  mode: 'beta', // Beta mode: immediate error reports on every app close
  emailEndpoint: import.meta.env.VITE_ERROR_LOG_ENDPOINT,
  emailTo: import.meta.env.VITE_ERROR_LOG_EMAIL,
  remoteConfigUrl: import.meta.env.VITE_ERROR_LOG_CONFIG_URL, // Optional: remote config for mode control
  enableConsoleLogging: true,
});

// Export convenience functions
export const logError = (message: string, error?: Error, category?: ErrorLog['category'], userAction?: string) =>
  errorLogger.logError(message, error, category, userAction);

export const logWarning = (message: string, category?: ErrorLog['category']) =>
  errorLogger.logWarning(message, category);

export const logInfo = (message: string, category?: ErrorLog['category']) =>
  errorLogger.logInfo(message, category);
