/**
 * Client Error Reporter Webhook
 * Receives error reports from the Solar Panel Calculator app and emails them to you
 * Supports email threading and reply-based mode control
 */

import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();
const PORT = process.env.PORT || 3001;

// Email configuration
const EMAIL_CONFIG = {
  service: 'gmail', // Can be 'gmail', 'outlook', 'yahoo', etc.
  auth: {
    user: process.env.EMAIL_USER || 'leothefleo49@gmail.com',
    pass: process.env.EMAIL_APP_PASSWORD, // Gmail App Password (not your regular password!)
  },
};

const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL || 'leothefleo49@gmail.com';

// Create email transporter
const transporter = nodemailer.createTransport(EMAIL_CONFIG);

// In-memory store for email thread mappings (threadId -> messageId)
// In production, use Redis or database
const emailThreads = new Map();

// In-memory store for user config (userId -> config)
// In production, use database
const userConfigs = new Map();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow larger payloads for error logs

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'client-error-reporter',
    timestamp: new Date().toISOString(),
  });
});

// Main webhook endpoint for error reports
app.post('/api/error-logs', async (req, res) => {
  try {
    const { to, subject, body, logs, threadId } = req.body;

    if (!logs || !Array.isArray(logs)) {
      return res.status(400).json({
        error: 'Invalid payload: logs array is required',
      });
    }

    console.log(`📧 Received error report with ${logs.length} logs`);

    // Prepare email
    const emailSubject = subject || `Solar Panel Calculator - Error Report (${logs.length} issues)`;
    const emailBody = body || generateErrorReport(logs);
    const recipientEmail = to || RECIPIENT_EMAIL;

    // Email options with threading support
    const mailOptions = {
      from: EMAIL_CONFIG.auth.user,
      to: recipientEmail,
      subject: emailSubject,
      text: emailBody,
      html: convertMarkdownToHtml(emailBody),
    };

    // Add In-Reply-To header for email threading
    if (threadId) {
      const previousMessageId = emailThreads.get(threadId);
      if (previousMessageId) {
        // Continue existing thread
        mailOptions.inReplyTo = previousMessageId;
        mailOptions.references = previousMessageId;
      }
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // Store message ID for future threading
    if (threadId && info.messageId) {
      emailThreads.set(threadId, info.messageId);
    }

    console.log(`✅ Email sent: ${info.messageId}`);

    res.json({
      success: true,
      messageId: info.messageId,
      logCount: logs.length,
      threadId: threadId,
    });
  } catch (error) {
    console.error('❌ Error sending email:', error);
    res.status(500).json({
      error: 'Failed to send error report',
      message: error.message,
    });
  }
});

// Alternative endpoint for simple text reports
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, body } = req.body;

    if (!body) {
      return res.status(400).json({
        error: 'Invalid payload: body is required',
      });
    }

    const info = await transporter.sendMail({
      from: EMAIL_CONFIG.auth.user,
      to: to || RECIPIENT_EMAIL,
      subject: subject || 'Solar Panel Calculator - App Report',
      text: body,
      html: convertMarkdownToHtml(body),
    });

    console.log(`✅ Email sent: ${info.messageId}`);

    res.json({
      success: true,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error('❌ Error sending email:', error);
    res.status(500).json({
      error: 'Failed to send email',
      message: error.message,
    });
  }
});

// Config endpoint for remote mode control
app.get('/api/config/:userId', (req, res) => {
  const { userId } = req.params;
  const config = userConfigs.get(userId) || {
    reportingInterval: 'every_run', // Default to immediate in beta
  };
  
  res.json(config);
});

// Update config endpoint (for testing or manual control)
app.post('/api/config/:userId', (req, res) => {
  const { userId } = req.params;
  const { reportingInterval } = req.body;
  
  const validIntervals = ['every_run', 'hourly', 'daily', 'weekly', 'biweekly', 'monthly', 'disabled'];
  
  if (!validIntervals.includes(reportingInterval)) {
    return res.status(400).json({
      error: 'Invalid reportingInterval',
      validValues: validIntervals,
    });
  }
  
  userConfigs.set(userId, { reportingInterval });
  console.log(`⚙️ Config updated for ${userId}: ${reportingInterval}`);
  
  res.json({
    success: true,
    userId,
    reportingInterval,
  });
});

// Email reply webhook (for Gmail forwarding or email service webhooks)
app.post('/api/email-reply', (req, res) => {
  try {
    // Parse email reply to detect mode commands
    // Format: "mode: daily" or "interval: daily"
    const { subject, body, from } = req.body;
    const text = `${subject} ${body}`.toLowerCase();
    
    const modeMatch = text.match(/(?:mode|interval):\s*(every_run|hourly|daily|weekly|biweekly|monthly|disabled)/i);
    
    if (modeMatch) {
      const newMode = modeMatch[1];
      
      // Extract user ID from email (simplified - use email as userId)
      const userId = from || 'default';
      
      userConfigs.set(userId, { reportingInterval: newMode });
      console.log(`📧 Mode changed via email reply: ${userId} -> ${newMode}`);
      
      // Send confirmation email
      transporter.sendMail({
        from: EMAIL_CONFIG.auth.user,
        to: from || RECIPIENT_EMAIL,
        subject: 'Solar Panel Calculator - Config Updated',
        text: `Your error reporting interval has been updated to: ${newMode}\n\nCurrent settings:\n- Interval: ${newMode}\n\nReply with another command to change it again.`,
      });
      
      return res.json({
        success: true,
        userId,
        newMode,
      });
    }
    
    res.json({
      success: false,
      message: 'No valid mode command found in email',
    });
  } catch (error) {
    console.error('❌ Error processing email reply:', error);
    res.status(500).json({
      error: 'Failed to process email reply',
      message: error.message,
    });
  }
});

// Generate formatted error report
function generateErrorReport(logs) {
  const errorCount = logs.filter(l => l.type === 'error').length;
  const warningCount = logs.filter(l => l.type === 'warning').length;

  let report = `# Solar Panel Calculator - Client Error Report\n\n`;
  report += `**Generated:** ${new Date().toLocaleString()}\n`;
  report += `**Total Issues:** ${logs.length} (${errorCount} errors, ${warningCount} warnings)\n\n`;
  report += `---\n\n`;

  // Group by category
  const byCategory = logs.reduce((acc, log) => {
    if (!acc[log.category]) acc[log.category] = [];
    acc[log.category].push(log);
    return acc;
  }, {});

  Object.entries(byCategory).forEach(([category, categoryLogs]) => {
    report += `## ${category.toUpperCase()} Issues (${categoryLogs.length})\n\n`;

    categoryLogs.forEach((log, index) => {
      const emoji = log.type === 'error' ? '🚨' : log.type === 'warning' ? '⚠️' : 'ℹ️';
      report += `### ${emoji} ${index + 1}. ${log.message}\n\n`;
      report += `- **Type:** ${log.type}\n`;
      report += `- **Time:** ${new Date(log.timestamp).toLocaleString()}\n`;
      report += `- **Platform:** ${log.context.platform}\n`;
      report += `- **App Version:** ${log.context.appVersion}\n`;
      report += `- **Screen:** ${log.context.screenResolution}\n`;

      if (log.context.userAction) {
        report += `- **User Action:** ${log.context.userAction}\n`;
      }

      // Show API key configuration status
      const apiStatus = log.context.apiKeysConfigured;
      const configuredApis = Object.entries(apiStatus)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(', ');
      if (configuredApis) {
        report += `- **APIs Configured:** ${configuredApis}\n`;
      }

      if (log.context.memory) {
        const memUsageMB = (log.context.memory.used / 1024 / 1024).toFixed(2);
        const memTotalMB = (log.context.memory.total / 1024 / 1024).toFixed(2);
        report += `- **Memory Usage:** ${memUsageMB}MB / ${memTotalMB}MB\n`;
      }

      if (log.stack) {
        report += `\n**Stack Trace:**\n\`\`\`\n${log.stack}\n\`\`\`\n`;
      }

      if (log.debuggingAdvice && log.debuggingAdvice.length > 0) {
        report += `\n**Debugging Advice:**\n`;
        log.debuggingAdvice.forEach(advice => {
          report += `- ${advice}\n`;
        });
      }

      if (log.suggestedFixes && log.suggestedFixes.length > 0) {
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

// Convert markdown to simple HTML
function convertMarkdownToHtml(markdown) {
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    // Code blocks
    .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    // Line breaks
    .replace(/\n/gim, '<br>')
    // Horizontal rules
    .replace(/---/g, '<hr>');

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #d32f2f; border-bottom: 2px solid #d32f2f; padding-bottom: 10px; }
          h2 { color: #1976d2; margin-top: 30px; }
          h3 { color: #424242; margin-top: 20px; }
          code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace; }
          pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
          pre code { background: none; padding: 0; }
          hr { border: none; border-top: 1px solid #e0e0e0; margin: 20px 0; }
          ul { padding-left: 20px; }
          li { margin: 5px 0; }
          strong { color: #1976d2; }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Client Error Reporter running on port ${PORT}`);
  console.log(`📧 Email: ${EMAIL_CONFIG.auth.user}`);
  console.log(`📬 Recipient: ${RECIPIENT_EMAIL}`);
  console.log(`\n💡 Endpoints:`);
  console.log(`   - POST /api/error-logs (main endpoint for app error reports with threading)`);
  console.log(`   - POST /api/send-email (simple email endpoint)`);
  console.log(`   - GET  /api/config/:userId (get user reporting config)`);
  console.log(`   - POST /api/config/:userId (update user reporting config)`);
  console.log(`   - POST /api/email-reply (webhook for email reply processing)`);
  console.log(`   - GET  /health (health check)`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});
