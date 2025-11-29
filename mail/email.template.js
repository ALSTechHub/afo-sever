export const passwordResetEmailTemplate = (user, resetURL, company) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password • ${company.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        line-height: 1.7;
        color: #1a202c;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        min-height: 100vh;
        padding: 20px;
      }
      
      .email-container {
        max-width: 580px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .email-header {
        padding: 40px 30px 30px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }
      
      .header-pattern {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        opacity: 0.1;
        background: radial-gradient(circle at 30% 20%, #60a5fa 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, #f87171 0%, transparent 50%);
      }
      
      .logo-container {
        position: relative;
        z-index: 2;
        margin-bottom: 20px;
      }
      
      .logo {
        max-width: 180px;
        height: auto;
        filter: brightness(0) invert(1);
      }
      
      .header-title {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 8px;
        position: relative;
        z-index: 2;
      }
      
      .header-subtitle {
        font-size: 16px;
        font-weight: 400;
        position: relative;
        z-index: 2;
      }
      
      .email-body {
        padding: 50px 40px 40px;
      }
      
      .greeting {
        font-size: 20px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 24px;
      }
      
      .message {
        color: #475569;
        font-size: 16px;
        margin-bottom: 32px;
        line-height: 1.8;
      }
      
      .reset-card {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 30px;
        margin: 32px 0;
        text-align: center;
      }
      
      .reset-icon {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.3);
      }
      
      .reset-icon svg {
        width: 36px;
        height: 36px;
        color: white;
      }
      
      .reset-button {
        display: inline-block;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white !important;
        text-decoration: none;
        padding: 16px 40px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 16px;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px -3px rgba(239, 68, 68, 0.4);
        border: none;
        cursor: pointer;
      }
      
      .reset-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px -5px rgba(239, 68, 68, 0.5);
      }
      
      .url-container {
        background: #0f172a;
        border-radius: 12px;
        padding: 20px;
        margin: 24px 0;
        border: 1px solid #334155;
      }
      
      .url-label {
        color: #94a3b8;
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .reset-url {
        color: #60a5fa;
        font-family: 'Monaco', 'Consolas', monospace;
        font-size: 14px;
        word-break: break-all;
        line-height: 1.5;
      }
      
      .security-note {
        background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
        border: 1px solid #fecaca;
        border-radius: 12px;
        padding: 20px;
        margin: 24px 0;
      }
      
      .security-title {
        color: #dc2626;
        font-weight: 600;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .security-text {
        color: #991b1b;
        font-size: 14px;
        line-height: 1.6;
      }
      
      .expiry-notice {
        background: #1e293b;
        color: #94a3b8;
        padding: 16px;
        border-radius: 12px;
        text-align: center;
        font-size: 14px;
        margin: 24px 0;
        border: 1px solid #334155;
      }
      
      .expiry-notice strong {
        color: #f87171;
      }
      
      .email-footer {
        padding: 40px 30px;
        text-align: center;
        color: #94a3b8;
      }
      
      .footer-logo {
        max-width: 120px;
        height: auto;
        margin-bottom: 20px;
        opacity: 0.8;
      }
      
      .company-info {
        font-size: 14px;
        line-height: 1.6;
        margin-bottom: 20px;
      }
      
      .contact-link {
        color: #60a5fa;
        text-decoration: none;
        transition: color 0.3s ease;
      }
      
      .contact-link:hover {
        color: #93c5fd;
      }
      
      .copyright {
        font-size: 12px;
        color: #64748b;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #334155;
      }
      
      @media (max-width: 600px) {
        .email-body {
          padding: 30px 20px;
        }
        
        .email-header {
          padding: 30px 20px 20px;
        }
        
        .header-title {
          font-size: 24px;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="email-header">
        <div class="header-pattern"></div>
        <div class="logo-container">
          <img src="${company.logo}" alt="${company.name}" class="logo">
        </div>
        <h1 class="header-title">Password Reset</h1>
        <p class="header-subtitle">Secure your account access</p>
      </div>
      
      <div class="email-body">
        <h2 class="greeting">Hello ${user.firstName},</h2>
        
        <p class="message">
          We received a request to reset your password for your <strong>${company.name}</strong> account. 
          Click the button below to securely create a new password.
        </p>
        
        <div class="reset-card">
          <div class="reset-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <a href="${resetURL}" class="reset-button">Reset Your Password</a>
        </div>
        
        <div class="url-container">
          <div class="url-label">Alternative Method</div>
          <div class="reset-url">${resetURL}</div>
        </div>
        
        <div class="security-note">
          <div class="security-title">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
            </svg>
            Security Alert
          </div>
          <p class="security-text">
            If you didn't request this password reset, please ignore this email immediately. 
            Your account security is important to us.
          </p>
        </div>
        
        <div class="expiry-notice">
          ⏰ This reset link will expire in <strong>10 minutes</strong> for your security
        </div>
      </div>
      
      <div class="email-footer">
        <div class="company-info">
          <p>${company.address}</p>
          <p>${company.phone} • <a href="mailto:${company.email}" class="contact-link">${company.email}</a></p>
        </div>
        <div class="copyright">
          © ${new Date().getFullYear()} ${company.name}. All Rights Reserved.<br>
          Protecting your digital security
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};

export const passwordResetSuccessTemplate = (user, company) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Confirmed • ${company.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        line-height: 1.7;
        color: #1a202c;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        min-height: 100vh;
        padding: 20px;
      }
      
      .email-container {
        max-width: 580px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .email-header {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        padding: 40px 30px 30px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }
      
      .header-pattern {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        opacity: 0.1;
        background: radial-gradient(circle at 30% 20%, #34d399 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, #10b981 0%, transparent 50%);
      }
      
      .logo-container {
        position: relative;
        z-index: 2;
        margin-bottom: 20px;
      }
      
      .logo {
        max-width: 180px;
        height: auto;
        filter: brightness(0) invert(1);
      }
      
      .header-title {
        color: white;
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 8px;
        position: relative;
        z-index: 2;
      }
      
      .header-subtitle {
        color: rgba(255, 255, 255, 0.8);
        font-size: 16px;
        font-weight: 400;
        position: relative;
        z-index: 2;
      }
      
      .email-body {
        padding: 50px 40px 40px;
      }
      
      .success-animation {
        text-align: center;
        margin-bottom: 30px;
      }
      
      .success-circle {
        width: 100px;
        height: 100px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        box-shadow: 0 15px 30px -10px rgba(16, 185, 129, 0.4);
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      
      .success-icon {
        width: 48px;
        height: 48px;
        color: white;
      }
      
      .greeting {
        font-size: 24px;
        font-weight: 600;
        color: #1e293b;
        text-align: center;
        margin-bottom: 16px;
      }
      
      .confirmation-message {
        text-align: center;
        color: #475569;
        font-size: 16px;
        margin-bottom: 40px;
        line-height: 1.8;
      }
      
      .timestamp {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        margin: 30px 0;
      }
      
      .timestamp-label {
        color: #64748b;
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .timestamp-value {
        color: #1e293b;
        font-size: 18px;
        font-weight: 600;
      }
      
      .security-section {
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        border: 1px solid #bbf7d0;
        border-radius: 16px;
        padding: 30px;
        margin: 32px 0;
      }
      
      .security-title {
        color: #059669;
        font-weight: 600;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 18px;
      }
      
      .security-list {
        color: #065f46;
        list-style: none;
        padding: 0;
      }
      
      .security-list li {
        padding: 8px 0;
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }
      
      .security-list li::before {
        content: "✓";
        color: #10b981;
        font-weight: bold;
        flex-shrink: 0;
        margin-top: 2px;
      }
      
      .next-steps {
        background: #1e293b;
        border-radius: 16px;
        padding: 30px;
        margin: 32px 0;
        color: #e2e8f0;
      }
      
      .next-steps-title {
        color: #f8fafc;
        font-weight: 600;
        margin-bottom: 16px;
        font-size: 18px;
      }
      
      .next-steps-list {
        list-style: none;
        padding: 0;
      }
      
      .next-steps-list li {
        padding: 8px 0;
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }
      
      .next-steps-list li::before {
        content: "→";
        color: #60a5fa;
        font-weight: bold;
        flex-shrink: 0;
      }
      
      .support-note {
        background: linear-gradient(135deg, #fef7ed 0%, #fed7aa 100%);
        border: 1px solid #fdba74;
        border-radius: 12px;
        padding: 20px;
        margin: 24px 0;
        text-align: center;
      }
      
      .support-text {
        color: #9a3412;
        font-size: 14px;
        line-height: 1.6;
      }
      
      .support-text strong {
        color: #ea580c;
      }
      
      .email-footer {
        background: #0f172a;
        padding: 40px 30px;
        text-align: center;
        color: #94a3b8;
      }
      
      .footer-logo {
        max-width: 120px;
        height: auto;
        margin-bottom: 20px;
        opacity: 0.8;
      }
      
      .company-info {
        font-size: 14px;
        line-height: 1.6;
        margin-bottom: 20px;
      }
      
      .contact-link {
        color: #60a5fa;
        text-decoration: none;
        transition: color 0.3s ease;
      }
      
      .contact-link:hover {
        color: #93c5fd;
      }
      
      .copyright {
        font-size: 12px;
        color: #64748b;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #334155;
      }
      
      @media (max-width: 600px) {
        .email-body {
          padding: 30px 20px;
        }
        
        .email-header {
          padding: 30px 20px 20px;
        }
        
        .header-title {
          font-size: 24px;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="email-header">
        <div class="header-pattern"></div>
        <div class="logo-container">
          <img src="${company.logo}" alt="${company.name}" class="logo">
        </div>
        <h1 class="header-title">Password Reset Confirmed</h1>
        <p class="header-subtitle">Your account is now secure</p>
      </div>
      
      <div class="email-body">
        <div class="success-animation">
          <div class="success-circle">
            <svg class="success-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        </div>
        
        <h2 class="greeting">Success, ${user.firstName}!</h2>
        
        <p class="confirmation-message">
          Your password for <strong>${company.name}</strong> has been successfully reset and your account is now secure.
        </p>
        
        <div class="timestamp">
          <div class="timestamp-label">Reset Completed</div>
          <div class="timestamp-value">${new Date().toLocaleString('en-US', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</div>
        </div>
        
        <div class="security-section">
          <div class="security-title">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
            </svg>
            Security Recommendations
          </div>
          <ul class="security-list">
            <li>Use a unique password that you don't use for other services</li>
            <li>Update your password regularly every 3-6 months</li>
            <li>Avoid using personal information in your passwords</li>
          </ul>
        </div>
        
        <div class="next-steps">
          <div class="next-steps-title">What's Next?</div>
          <ul class="next-steps-list">
            <li>Sign in to your account with your new password</li>
            <li>Review your account security settings</li>
            <li>Update your recovery email and phone number</li>
            <li>Explore new features in your dashboard</li>
          </ul>
        </div>
        
        <div class="support-note">
          <p class="support-text">
            <strong>Need help?</strong> If you didn't make this change or believe someone else has accessed your account, 
            contact our support team immediately at <a href="mailto:${company.email}" class="contact-link">${company.email}</a>
          </p>
        </div>
      </div>
      
      <div class="email-footer">
        <div class="company-info">
          <p>${company.address}</p>
          <p>${company.phone} • <a href="mailto:${company.email}" class="contact-link">${company.email}</a></p>
        </div>
        <div class="copyright">
          © ${new Date().getFullYear()} ${company.name}. All Rights Reserved.<br>
          Committed to your digital security and privacy
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};

export const bookingConfirmationTemplate = (booking, company) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Received • ${company.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        line-height: 1.7;
        color: #1a202c;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        min-height: 100vh;
        padding: 20px;
      }
      
      .email-container {
        max-width: 620px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .email-header {
        background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
        padding: 40px 30px 30px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }
      
      .header-pattern {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        opacity: 0.1;
        background: radial-gradient(circle at 30% 20%, #60a5fa 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, #f87171 0%, transparent 50%);
      }
      
      .logo-container {
        position: relative;
        z-index: 2;
        margin-bottom: 20px;
      }
      
      .logo {
        max-width: 180px;
        height: auto;
        filter: brightness(0) invert(1);
      }
      
      .header-title {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 8px;
        position: relative;
        z-index: 2;
      }
      
      .header-subtitle {
        font-size: 16px;
        font-weight: 400;
        position: relative;
        z-index: 2;
      }
      
      .email-body {
        padding: 50px 40px 40px;
      }
      
      .greeting {
        font-size: 24px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 24px;
      }
      
      .confirmation-icon {
        text-align: center;
        margin: 30px 0;
      }
      
      .icon-circle {
        width: 100px;
        height: 100px;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto;
        box-shadow: 0 15px 30px -10px rgba(59, 130, 246, 0.4);
      }
      
      .icon-circle svg {
        width: 48px;
        height: 48px;
        color: white;
      }
      
      .booking-details {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 30px;
        margin: 30px 0;
      }
      
      .details-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-top: 20px;
      }
      
      .detail-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .detail-label {
        color: #64748b;
        font-size: 14px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .detail-value {
        color: #1e293b;
        font-size: 16px;
        font-weight: 600;
      }
      
      .reference-card {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border-radius: 12px;
        padding: 25px;
        text-align: center;
        margin: 30px 0;
        color: white;
      }
      
      .reference-label {
        color: #94a3b8;
        font-size: 14px;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .reference-number {
        color: #60a5fa;
        font-size: 28px;
        font-weight: 700;
        font-family: 'Monaco', 'Consolas', monospace;
        letter-spacing: 2px;
      }
      
      .next-steps {
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        border: 1px solid #bbf7d0;
        border-radius: 16px;
        padding: 30px;
        margin: 30px 0;
      }
      
      .next-steps-title {
        color: #059669;
        font-weight: 600;
        margin-bottom: 16px;
        font-size: 18px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .steps-list {
        color: #065f46;
        list-style: none;
        padding: 0;
      }
      
      .steps-list li {
        padding: 8px 0;
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }
      
      .steps-list li::before {
        content: "→";
        color: #10b981;
        font-weight: bold;
        flex-shrink: 0;
      }
      
      .support-section {
        background: linear-gradient(135deg, #fef7ed 0%, #fed7aa 100%);
        border: 1px solid #fdba74;
        border-radius: 12px;
        padding: 25px;
        margin: 30px 0;
        text-align: center;
      }
      
      .support-text {
        color: #9a3412;
        font-size: 14px;
        line-height: 1.6;
      }
      
      .contact-link {
        color: #ea580c;
        text-decoration: none;
        font-weight: 600;
      }
      
      .email-footer {
        background: #0f172a;
        padding: 40px 30px;
        text-align: center;
        color: #94a3b8;
      }
      
      .footer-logo {
        max-width: 120px;
        height: auto;
        margin-bottom: 20px;
        opacity: 0.8;
      }
      
      .company-info {
        font-size: 14px;
        line-height: 1.6;
        margin-bottom: 20px;
      }
      
      .copyright {
        font-size: 12px;
        color: #64748b;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #334155;
      }
      
      @media (max-width: 600px) {
        .email-body {
          padding: 30px 20px;
        }
        
        .email-header {
          padding: 30px 20px 20px;
        }
        
        .header-title {
          font-size: 24px;
        }
        
        .details-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="email-header">
        <div class="header-pattern"></div>
        <h1 class="header-title">Booking Received!</h1>
        <p class="header-subtitle">We've got your booking request</p>
      </div>
      
      <div class="email-body">
        <h2 class="greeting">Hello ${booking.firstName},</h2>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.8; margin-bottom: 24px;">
          Thank you for choosing <strong>${company.name}</strong>! We've received your booking request and 
          our team is reviewing it. We'll get back to you shortly with confirmation.
        </p>
        
        <div class="confirmation-icon">
          <div class="icon-circle">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
        
        <div class="booking-details">
          <h3 style="color: #1e293b; font-size: 20px; font-weight: 600; margin-bottom: 20px;">Booking Details</h3>
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Service Type: </span>
              <span class="detail-value"> ${booking.serviceType}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Scheduled Date: </span>
              <span class="detail-value"> ${new Date(booking.visitDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Time: </span>
              <span class="detail-value"> ${booking.visitTime}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Duration: </span>
              <span class="detail-value"> ${booking.duration} minutes</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Client Name: </span>
              <span class="detail-value"> ${booking.firstName} ${booking.lastName}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Contact: </span>
              <span class="detail-value"> ${booking.phone} • ${booking.email}</span>
            </div>
          </div>
        </div>
        
        <div class="reference-card">
          <div class="reference-label">Your Reference Number</div>
          <div class="reference-number">${booking.referenceNumber}</div>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 12px;">
            Please keep this number for all communications
          </p>
        </div>
        
        <div class="next-steps">
          <div class="next-steps-title">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd"/>
            </svg>
            What Happens Next?
          </div>
          <ul class="steps-list">
            <li>We'll review your booking within 24 hours</li>
            <li>You'll receive a confirmation email once approved</li>
            <li>Our team will contact you if we need more information</li>
            <li>Get ready for an amazing experience!</li>
          </ul>
        </div>
        
        <div class="support-section">
          <p class="support-text">
            <strong>Questions?</strong> Need to make changes? Contact us at 
            <a href="mailto:${company.email}" class="contact-link">${company.email}</a> or call 
            <a href="tel:${company.phone}" class="contact-link">${company.phone}</a>
          </p>
        </div>
      </div>
      
      <div class="email-footer">
        <div class="company-info">
          <p>${company.address}</p>
          <p>${company.phone} • <a href="mailto:${company.email}" style="color: #60a5fa; text-decoration: none;">${company.email}</a></p>
        </div>
        <div class="copyright">
          © ${new Date().getFullYear()} ${company.name}. All Rights Reserved.<br>
          We're excited to serve you!
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};

export const bookingConfirmedTemplate = (booking, company) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmed • ${company.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        line-height: 1.7;
        color: #1a202c;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        min-height: 100vh;
        padding: 20px;
      }
      
      .email-container {
        max-width: 620px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .email-header {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        padding: 40px 30px 30px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }
      
      .header-pattern {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        opacity: 0.1;
        background: radial-gradient(circle at 30% 20%, #34d399 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, #10b981 0%, transparent 50%);
      }
      
      .logo-container {
        position: relative;
        z-index: 2;
        margin-bottom: 20px;
      }
      
      .logo {
        max-width: 180px;
        height: auto;
        filter: brightness(0) invert(1);
      }
      
      .header-title {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 8px;
        position: relative;
        z-index: 2;
      }
      
      .header-subtitle {
        font-size: 16px;
        font-weight: 400;
        position: relative;
        z-index: 2;
      }
      
      .email-body {
        padding: 50px 40px 40px;
      }
      
      .success-animation {
        text-align: center;
        margin-bottom: 30px;
      }
      
      .success-circle {
        width: 120px;
        height: 120px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        box-shadow: 0 20px 40px -10px rgba(16, 185, 129, 0.4);
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      
      .success-icon {
        width: 60px;
        height: 60px;
        color: white;
      }
      
      .greeting {
        font-size: 28px;
        font-weight: 700;
        color: #059669;
        text-align: center;
        margin-bottom: 16px;
      }
      
      .welcome-message {
        text-align: center;
        color: #475569;
        font-size: 18px;
        margin-bottom: 40px;
        line-height: 1.8;
      }
      
      .booking-card {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border-radius: 20px;
        padding: 35px;
        margin: 40px 0;
        color: white;
      }
      
      .card-title {
        color: #60a5fa;
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 25px;
        text-align: center;
      }
      
      .details-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
      }
      
      .detail-item {
        text-align: center;
        padding: 15px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .detail-label {
        color: #94a3b8;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      }
      
      .detail-value {
        color: white;
        font-size: 16px;
        font-weight: 600;
      }
      
      .reference-highlight {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        margin: 25px 0;
      }
      
      .reference-number {
        color: white;
        font-size: 24px;
        font-weight: 700;
        font-family: 'Monaco', 'Consolas', monospace;
        letter-spacing: 2px;
      }
      
      .preparation-tips {
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        border: 1px solid #bbf7d0;
        border-radius: 16px;
        padding: 30px;
        margin: 30px 0;
      }
      
      .tips-title {
        color: #059669;
        font-weight: 600;
        margin-bottom: 16px;
        font-size: 18px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .tips-list {
        color: #065f46;
        list-style: none;
        padding: 0;
      }
      
      .tips-list li {
        padding: 10px 0;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        border-bottom: 1px solid #bbf7d0;
      }
      
      .tips-list li:last-child {
        border-bottom: none;
      }
      
      .tips-list li::before {
        content: "💡";
        flex-shrink: 0;
        margin-top: 2px;
      }
      
      .cta-section {
        text-align: center;
        margin: 40px 0;
      }
      
      .cta-button {
        display: inline-block;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white !important;
        text-decoration: none;
        padding: 18px 45px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 18px;
        transition: all 0.3s ease;
        box-shadow: 0 8px 25px -5px rgba(239, 68, 68, 0.4);
        border: none;
        cursor: pointer;
      }
      
      .cta-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 35px -5px rgba(239, 68, 68, 0.5);
      }
      
      .email-footer {
        background: #0f172a;
        padding: 40px 30px;
        text-align: center;
        color: #94a3b8;
      }
      
      .footer-logo {
        max-width: 120px;
        height: auto;
        margin-bottom: 20px;
        opacity: 0.8;
      }
      
      .company-info {
        font-size: 14px;
        line-height: 1.6;
        margin-bottom: 20px;
      }
      
      .copyright {
        font-size: 12px;
        color: #64748b;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #334155;
      }
      
      @media (max-width: 600px) {
        .email-body {
          padding: 30px 20px;
        }
        
        .email-header {
          padding: 30px 20px 20px;
        }
        
        .header-title {
          font-size: 24px;
        }
        
        .details-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="email-header">
        <div class="header-pattern"></div>
        <h1 class="header-title">Booking Confirmed! 🎉</h1>
        <p class="header-subtitle">Welcome to the ${company.name} family!</p>
      </div>
      
      <div class="email-body">
        <div class="success-animation">
          <div class="success-circle">
            <svg class="success-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        </div>
        
        <h2 class="greeting">Welcome, ${booking.firstName}! 🎊</h2>
        
        <p class="welcome-message">
          We're thrilled to confirm your booking with <strong>${company.name}</strong>! 
          Get ready for an exceptional experience tailored just for you.
        </p>
        
        <div class="booking-card">
          <div class="card-title">Your Confirmed Appointment</div>
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Service</div>
              <div class="detail-value">${booking.serviceType}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Date</div>
              <div class="detail-value">${new Date(booking.visitDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Time</div>
              <div class="detail-value">${booking.visitTime}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Duration</div>
              <div class="detail-value">${booking.duration} minutes</div>
            </div>
          </div>
          
          <div class="reference-highlight">
            <div style="color: #fef3c7; font-size: 14px; margin-bottom: 8px;">Reference Number</div>
            <div class="reference-number">${booking.referenceNumber}</div>
          </div>
        </div>
        
        <div class="preparation-tips">
          <div class="tips-title">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
            </svg>
            Preparation Tips
          </div>
          <ul class="tips-list">
            <li>Arrive 15 minutes before your scheduled time</li>
            <li>Bring any necessary documents or materials</li>
            <li>Have your reference number ready for check-in</li>
            <li>Feel free to contact us if you have any questions</li>
          </ul>
        </div>
        
        <div class="cta-section">
          <p style="color: #475569; font-size: 16px; margin-bottom: 20px; line-height: 1.6;">
            We can't wait to provide you with outstanding service!<br>
            Our team is preparing something special for you.
          </p>
          <a href="tel:${company.phone}" class="cta-button">Call Us if Needed</a>
        </div>
      </div>
      
      <div class="email-footer">
        <div class="company-info">
          <p>${company.address}</p>
          <p>${company.phone} • <a href="mailto:${company.email}" style="color: #60a5fa; text-decoration: none;">${company.email}</a></p>
        </div>
        <div class="copyright">
          © ${new Date().getFullYear()} ${company.name}. All Rights Reserved.<br>
          Creating exceptional experiences for you!
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};

export const bookingCompletedTemplate = (booking, company) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Service Completed • ${company.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        line-height: 1.7;
        color: #1a202c;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        min-height: 100vh;
        padding: 20px;
      }
      
      .email-container {
        max-width: 620px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .email-header {
        background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        padding: 40px 30px 30px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }
      
      .header-pattern {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        opacity: 0.1;
        background: radial-gradient(circle at 30% 20%, #a78bfa 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, #c4b5fd 0%, transparent 50%);
      }
      
      .logo-container {
        position: relative;
        z-index: 2;
        margin-bottom: 20px;
      }
      
      .logo {
        max-width: 180px;
        height: auto;
        filter: brightness(0) invert(1);
      }
      
      .header-title {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 8px;
        position: relative;
        z-index: 2;
      }
      
      .header-subtitle {
        font-size: 16px;
        font-weight: 400;
        position: relative;
        z-index: 2;
      }
      
      .email-body {
        padding: 50px 40px 40px;
      }
      
      .thank-you-section {
        text-align: center;
        margin-bottom: 40px;
      }
      
      .heart-animation {
        font-size: 80px;
        margin-bottom: 20px;
        animation: heartbeat 1.5s ease-in-out infinite;
      }
      
      @keyframes heartbeat {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      
      .greeting {
        font-size: 28px;
        font-weight: 700;
        color: #7c3aed;
        margin-bottom: 16px;
      }
      
      .thank-you-message {
        color: #475569;
        font-size: 18px;
        line-height: 1.8;
        margin-bottom: 30px;
      }
      
      .completion-card {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        padding: 35px;
        margin: 40px 0;
        text-align: center;
      }
      
      .completion-icon {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        box-shadow: 0 15px 30px -10px rgba(16, 185, 129, 0.4);
      }
      
      .completion-icon svg {
        width: 40px;
        height: 40px;
        color: white;
      }
      
      .service-completed {
        color: #059669;
        font-size: 24px;
        font-weight: 600;
        margin-bottom: 15px;
      }
      
      .service-details {
        color: #64748b;
        font-size: 16px;
        margin-bottom: 25px;
      }
      
      .feedback-section {
        background: linear-gradient(135deg, #fef7ed 0%, #fed7aa 100%);
        border: 1px solid #fdba74;
        border-radius: 16px;
        padding: 30px;
        margin: 30px 0;
        text-align: center;
      }
      
      .feedback-title {
        color: #ea580c;
        font-weight: 600;
        margin-bottom: 16px;
        font-size: 20px;
      }
      
      .feedback-text {
        color: #9a3412;
        font-size: 16px;
        line-height: 1.6;
        margin-bottom: 25px;
      }
      
      .feedback-button {
        display: inline-block;
        background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
        color: white !important;
        text-decoration: none;
        padding: 16px 35px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 16px;
        transition: all 0.3s ease;
        box-shadow: 0 8px 25px -5px rgba(234, 88, 12, 0.4);
        border: none;
        cursor: pointer;
      }
      
      .feedback-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 35px -5px rgba(234, 88, 12, 0.5);
      }
      
      .next-steps {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border-radius: 16px;
        padding: 30px;
        margin: 30px 0;
        color: #e2e8f0;
      }
      
      .next-steps-title {
        color: #f8fafc;
        font-weight: 600;
        margin-bottom: 16px;
        font-size: 18px;
        text-align: center;
      }
      
      .next-steps-list {
        list-style: none;
        padding: 0;
        text-align: center;
      }
      
      .next-steps-list li {
        padding: 12px 0;
        font-size: 15px;
        border-bottom: 1px solid #334155;
      }
      
      .next-steps-list li:last-child {
        border-bottom: none;
      }
      
      .loyalty-offer {
        background: linear-gradient(135deg, #fef7ed 0%, #fed7aa 100%);
        border: 2px dashed #ea580c;
        border-radius: 16px;
        padding: 30px;
        margin: 30px 0;
        text-align: center;
      }
      
      .offer-title {
        color: #ea580c;
        font-weight: 700;
        font-size: 22px;
        margin-bottom: 12px;
      }
      
      .offer-text {
        color: #9a3412;
        font-size: 16px;
        line-height: 1.6;
      }
      
      .email-footer {
        background: #0f172a;
        padding: 40px 30px;
        text-align: center;
        color: #94a3b8;
      }
      
      .footer-logo {
        max-width: 120px;
        height: auto;
        margin-bottom: 20px;
        opacity: 0.8;
      }
      
      .company-info {
        font-size: 14px;
        line-height: 1.6;
        margin-bottom: 20px;
      }
      
      .copyright {
        font-size: 12px;
        color: #64748b;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #334155;
      }
      
      @media (max-width: 600px) {
        .email-body {
          padding: 30px 20px;
        }
        
        .email-header {
          padding: 30px 20px 20px;
        }
        
        .header-title {
          font-size: 24px;
        }
        
        .heart-animation {
          font-size: 60px;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="email-header">
        <div class="header-pattern"></div>
        <h1 class="header-title">Service Completed! 🌟</h1>
        <p class="header-subtitle">Thank you for choosing ${company.name}</p>
      </div>
      
      <div class="email-body">
        <div class="thank-you-section">
          <div class="heart-animation">💜</div>
          <h2 class="greeting">Thank You, ${booking.firstName}!</h2>
          <p class="thank-you-message">
            We hope you had an amazing experience with us!<br>
            It was our pleasure to serve you and we're grateful for your trust in ${company.name}.
          </p>
        </div>
        
        <div class="completion-card">
          <div class="completion-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div class="service-completed">Service Successfully Completed</div>
          <div class="service-details">
            ${booking.serviceType} • ${new Date(booking.visitDate).toLocaleDateString()} • Ref: ${booking.referenceNumber}
          </div>
        </div>
        
        <div class="feedback-section">
          <div class="feedback-title">How Was Your Experience?</div>
          <p class="feedback-text">
            Your feedback helps us improve and continue delivering exceptional service.<br>
            We'd love to hear about your experience with us!
          </p>
          <a href="mailto:${company.email}?subject=Feedback for Booking ${booking.referenceNumber}" class="feedback-button">
            Share Your Feedback
          </a>
        </div>
        
        <div class="next-steps">
          <div class="next-steps-title">What's Next?</div>
          <ul class="next-steps-list">
            <li>You'll receive any follow-up documents within 24 hours</li>
            <li>Keep an eye on your email for important updates</li>
            <li>We're here if you need any post-service support</li>
            <li>Looking forward to serving you again soon!</li>
          </ul>
        </div>
        
        <div class="loyalty-offer">
          <div class="offer-title">Special Loyalty Offer! 🎁</div>
          <p class="offer-text">
            As a valued customer, enjoy <strong>15% OFF</strong> your next booking with us!<br>
            Mention code: <strong>THANKYOU15</strong> when you book again.
          </p>
        </div>
      </div>
      
      <div class="email-footer">
        <div class="company-info">
          <p>${company.address}</p>
          <p>${company.phone} • <a href="mailto:${company.email}" style="color: #60a5fa; text-decoration: none;">${company.email}</a></p>
        </div>
        <div class="copyright">
          © ${new Date().getFullYear()} ${company.name}. All Rights Reserved.<br>
          Thank you for being an amazing customer!
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};

export const bookingCancelledTemplate = (booking, company) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Cancelled • ${company.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        line-height: 1.7;
        color: #1a202c;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        min-height: 100vh;
        padding: 20px;
      }
      
      .email-container {
        max-width: 620px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .email-header {
        background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
        padding: 40px 30px 30px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }
      
      .header-pattern {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        opacity: 0.1;
        background: radial-gradient(circle at 30% 20%, #9ca3af 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, #6b7280 0%, transparent 50%);
      }
      
      .logo-container {
        position: relative;
        z-index: 2;
        margin-bottom: 20px;
      }
      
      .logo {
        max-width: 180px;
        height: auto;
        filter: brightness(0) invert(1);
      }
      
      .header-title {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 8px;
        position: relative;
        z-index: 2;
      }
      
      .header-subtitle {
        font-size: 16px;
        font-weight: 400;
        position: relative;
        z-index: 2;
      }
      
      .email-body {
        padding: 50px 40px 40px;
      }
      
      .sad-section {
        text-align: center;
        margin-bottom: 40px;
      }
      
      .sad-emoji {
        font-size: 80px;
        margin-bottom: 20px;
        animation: sadBounce 2s ease-in-out infinite;
      }
      
      @keyframes sadBounce {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-10px) rotate(5deg); }
      }
      
      .greeting {
        font-size: 28px;
        font-weight: 700;
        color: #6b7280;
        margin-bottom: 16px;
      }
      
      .cancellation-message {
        color: #475569;
        font-size: 18px;
        line-height: 1.8;
        margin-bottom: 30px;
      }
      
      .cancellation-card {
        background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        border: 1px solid #fecaca;
        border-radius: 20px;
        padding: 35px;
        margin: 40px 0;
        text-align: center;
      }
      
      .cancellation-icon {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        box-shadow: 0 15px 30px -10px rgba(239, 68, 68, 0.4);
      }
      
      .cancellation-icon svg {
        width: 40px;
        height: 40px;
        color: white;
      }
      
      .cancellation-title {
        color: #dc2626;
        font-size: 24px;
        font-weight: 600;
        margin-bottom: 15px;
      }
      
      .cancellation-details {
        color: #991b1b;
        font-size: 16px;
        margin-bottom: 25px;
      }
      
      .rebooking-section {
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        border: 1px solid #bbf7d0;
        border-radius: 16px;
        padding: 30px;
        margin: 30px 0;
        text-align: center;
      }
      
      .rebooking-title {
        color: #059669;
        font-weight: 600;
        margin-bottom: 16px;
        font-size: 20px;
      }
      
      .rebooking-text {
        color: #065f46;
        font-size: 16px;
        line-height: 1.6;
        margin-bottom: 25px;
      }
      
      .rebooking-button {
        display: inline-block;
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        color: white !important;
        text-decoration: none;
        padding: 16px 35px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 16px;
        transition: all 0.3s ease;
        box-shadow: 0 8px 25px -5px rgba(5, 150, 105, 0.4);
        border: none;
        cursor: pointer;
      }
      
      .rebooking-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 35px -5px rgba(5, 150, 105, 0.5);
      }
      
      .support-section {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border-radius: 16px;
        padding: 30px;
        margin: 30px 0;
        color: #e2e8f0;
        text-align: center;
      }
      
      .support-title {
        color: #f8fafc;
        font-weight: 600;
        margin-bottom: 16px;
        font-size: 18px;
      }
      
      .support-text {
        color: #94a3b8;
        font-size: 15px;
        line-height: 1.6;
        margin-bottom: 20px;
      }
      
      .support-contact {
        color: #60a5fa;
        font-weight: 600;
        font-size: 16px;
      }
      
      .future-hope {
        background: linear-gradient(135deg, #fef7ed 0%, #fed7aa 100%);
        border: 2px dashed #ea580c;
        border-radius: 16px;
        padding: 25px;
        margin: 30px 0;
        text-align: center;
      }
      
      .hope-text {
        color: #9a3412;
        font-size: 16px;
        line-height: 1.6;
        font-style: italic;
      }
      
      .email-footer {
        background: #0f172a;
        padding: 40px 30px;
        text-align: center;
        color: #94a3b8;
      }
      
      .footer-logo {
        max-width: 120px;
        height: auto;
        margin-bottom: 20px;
        opacity: 0.8;
      }
      
      .company-info {
        font-size: 14px;
        line-height: 1.6;
        margin-bottom: 20px;
      }
      
      .copyright {
        font-size: 12px;
        color: #64748b;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #334155;
      }
      
      @media (max-width: 600px) {
        .email-body {
          padding: 30px 20px;
        }
        
        .email-header {
          padding: 30px 20px 20px;
        }
        
        .header-title {
          font-size: 24px;
        }
        
        .sad-emoji {
          font-size: 60px;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="email-header">
        <div class="header-pattern"></div>
        <h1 class="header-title">Booking Cancelled 😢</h1>
        <p class="header-subtitle">We're sad to see you go</p>
      </div>
      
      <div class="email-body">
        <div class="sad-section">
          <div class="sad-emoji">😔💔</div>
          <h2 class="greeting">We'll Miss You, ${booking.firstName}</h2>
          <p class="cancellation-message">
            We're sorry to see your booking cancelled.<br>
            We understand that plans change and hope to welcome you back soon!
          </p>
        </div>
        
        <div class="cancellation-card">
          <div class="cancellation-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </div>
          <div class="cancellation-title">Booking Cancelled</div>
          <div class="cancellation-details">
            ${booking.serviceType} • ${new Date(booking.visitDate).toLocaleDateString()} • Ref: ${booking.referenceNumber}
          </div>
        </div>
        
        <div class="rebooking-section">
          <div class="rebooking-title">Ready to Try Again? 🌟</div>
          <p class="rebooking-text">
            We'd love another opportunity to serve you!<br>
            Book again and enjoy priority scheduling for your next appointment.
          </p>
          <a href="${company.website}/book-visit" class="rebooking-button">
            Book a New Appointment
          </a>
        </div>
        
        <div class="support-section">
          <div class="support-title">Need Help?</div>
          <p class="support-text">
            If you cancelled by mistake or want to discuss your booking,<br>
            our team is here to help you!
          </p>
          <div class="support-contact">
            📞 ${company.phone} • ✉️ ${company.email}
          </div>
        </div>
        
        <div class="future-hope">
          <p class="hope-text">
            "We hope to have the pleasure of serving you in the future.<br>
            Your satisfaction means everything to us."
          </p>
        </div>
      </div>
      
      <div class="email-footer">
        <div class="company-info">
          <p>${company.address}</p>
          <p>${company.phone} • <a href="mailto:${company.email}" style="color: #60a5fa; text-decoration: none;">${company.email}</a></p>
        </div>
        <div class="copyright">
          © ${new Date().getFullYear()} ${company.name}. All Rights Reserved.<br>
          We hope to see you again soon!
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};

export const leadConfirmationTemplate = (lead, company) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Property Interest Received • ${company.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        line-height: 1.7;
        color: #1a202c;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        min-height: 100vh;
        padding: 20px;
      }
      
      .email-container {
        max-width: 620px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .email-header {
        background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
        padding: 40px 30px 30px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }
      
      .header-pattern {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        opacity: 0.1;
        background: radial-gradient(circle at 30% 20%, #60a5fa 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, #f87171 0%, transparent 50%);
      }
      
      .logo-container {
        position: relative;
        z-index: 2;
        margin-bottom: 20px;
      }
      
      .logo {
        max-width: 180px;
        height: auto;
        filter: brightness(0) invert(1);
      }
      
      .header-title {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 8px;
        position: relative;
        z-index: 2;
      }
      
      .header-subtitle {
        font-size: 16px;
        font-weight: 400;
        position: relative;
        z-index: 2;
      }
      
      .email-body {
        padding: 50px 40px 40px;
      }
      
      .greeting {
        font-size: 24px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 24px;
      }
      
      .property-icon {
        text-align: center;
        margin: 30px 0;
      }
      
      .icon-circle {
        width: 100px;
        height: 100px;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto;
        box-shadow: 0 15px 30px -10px rgba(245, 158, 11, 0.4);
      }
      
      .icon-circle svg {
        width: 48px;
        height: 48px;
        color: white;
      }
      
      .property-details {
        background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
        border: 1px solid #fcd34d;
        border-radius: 20px;
        padding: 35px;
        margin: 30px 0;
        position: relative;
        overflow: hidden;
      }
      
      .property-badge {
        position: absolute;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .property-title {
        color: #92400e;
        font-size: 22px;
        font-weight: 700;
        margin-bottom: 15px;
        line-height: 1.4;
      }
      
      .property-info {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-top: 20px;
      }
      
      .info-item {
        text-align: center;
        padding: 15px;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 12px;
        border: 1px solid #fcd34d;
      }
      
      .info-label {
        color: #92400e;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      }
      
      .info-value {
        color: #1e293b;
        font-size: 16px;
        font-weight: 700;
      }
      
      .lead-details {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 30px;
        margin: 30px 0;
      }
      
      .lead-title {
        color: #1e293b;
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 20px;
        text-align: center;
      }
      
      .lead-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 15px;
      }
      
      .lead-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .lead-label {
        color: #64748b;
        font-size: 14px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .lead-value {
        color: #1e293b;
        font-size: 16px;
        font-weight: 600;
      }
      
      .next-steps {
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        border: 1px solid #bbf7d0;
        border-radius: 16px;
        padding: 30px;
        margin: 30px 0;
      }
      
      .steps-title {
        color: #059669;
        font-weight: 600;
        margin-bottom: 16px;
        font-size: 18px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .steps-list {
        color: #065f46;
        list-style: none;
        padding: 0;
      }
      
      .steps-list li {
        padding: 10px 0;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        border-bottom: 1px solid #bbf7d0;
      }
      
      .steps-list li:last-child {
        border-bottom: none;
      }
      
      .steps-list li::before {
        content: "🏠";
        flex-shrink: 0;
        margin-top: 2px;
      }
      
      .contact-section {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border-radius: 16px;
        padding: 30px;
        margin: 30px 0;
        color: #e2e8f0;
        text-align: center;
      }
      
      .contact-title {
        color: #f8fafc;
        font-weight: 600;
        margin-bottom: 16px;
        font-size: 18px;
      }
      
      .contact-info {
        color: #94a3b8;
        font-size: 15px;
        line-height: 1.6;
        margin-bottom: 20px;
      }
      
      .contact-button {
        display: inline-block;
        background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
        color: white !important;
        text-decoration: none;
        padding: 14px 32px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 16px;
        transition: all 0.3s ease;
        box-shadow: 0 8px 25px -5px rgba(59, 130, 246, 0.4);
        border: none;
        cursor: pointer;
      }
      
      .contact-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 35px -5px rgba(59, 130, 246, 0.5);
      }
      
      .email-footer {
        background: #0f172a;
        padding: 40px 30px;
        text-align: center;
        color: #94a3b8;
      }
      
      .footer-logo {
        max-width: 120px;
        height: auto;
        margin-bottom: 20px;
        opacity: 0.8;
      }
      
      .company-info {
        font-size: 14px;
        line-height: 1.6;
        margin-bottom: 20px;
      }
      
      .copyright {
        font-size: 12px;
        color: #64748b;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #334155;
      }
      
      @media (max-width: 600px) {
        .email-body {
          padding: 30px 20px;
        }
        
        .email-header {
          padding: 30px 20px 20px;
        }
        
        .header-title {
          font-size: 24px;
        }
        
        .property-info,
        .lead-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="email-header">
        <div class="header-pattern"></div>
        <h1 class="header-title">Property Interest Received! 🏡</h1>
        <p class="header-subtitle">Your dream property awaits</p>
      </div>
      
      <div class="email-body">
        <h2 class="greeting">Hello ${lead.firstName},</h2>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.8; margin-bottom: 24px;">
          Thank you for expressing interest in our property! We're excited to help you find your perfect space 
          and our team will contact you shortly to discuss your requirements.
        </p>
        
        <div class="property-icon">
          <div class="icon-circle">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
          </div>
        </div>
        
        <div class="property-details">
          <div class="property-badge">Available</div>
          <h3 class="property-title">${lead.property.title}</h3>
          <div class="property-info">
            <div class="info-item">
              <div class="info-label">Price</div>
              <div class="info-value">${lead.property.price}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Location</div>
              <div class="info-value">${lead.property.location}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Status</div>
              <div class="info-value" style="color: #059669; text-transform: capitalize;">${lead.property.status}</div>
            </div>
          </div>
        </div>
        
        <div class="lead-details">
          <h3 class="lead-title">Your Contact Information</h3>
          <div class="lead-grid">
            <div class="lead-item">
              <span class="lead-label">Full Name: </span>
              <span class="lead-value"> ${lead.firstName} ${lead.lastName}</span>
            </div>
            <div class="lead-item">
              <span class="lead-label">Email Address: </span>
              <span class="lead-value"> ${lead.email}</span>
            </div>
            <div class="lead-item">
              <span class="lead-label">Phone Number: </span>
              <span class="lead-value"> ${lead.phoneNumber}</span>
            </div>
            <div class="lead-item">
              <span class="lead-label">Inquiry Date: </span>
              <span class="lead-value"> ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
        
        <div class="next-steps">
          <div class="steps-title">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd"/>
            </svg>
            What Happens Next?
          </div>
          <ul class="steps-list">
            <li>Our property expert will contact you within 24 hours</li>
            <li>We'll schedule a property viewing at your convenience</li>
            <li>Get detailed information about the property features</li>
            <li>Discuss financing options and next steps</li>
          </ul>
        </div>
        
        <div class="contact-section">
          <div class="contact-title">Ready to See More?</div>
          <p class="contact-info">
            Can't wait to hear from us? Feel free to reach out directly!<br>
            We're here to make your property journey smooth and exciting.
          </p>
          <a href="tel:${company.phone}" class="contact-button">Call Us Now</a>
        </div>
      </div>
      
      <div class="email-footer">
        <div class="company-info">
          <p>${company.address}</p>
          <p>${company.phone} • <a href="mailto:${company.email}" style="color: #60a5fa; text-decoration: none;">${company.email}</a></p>
        </div>
        <div class="copyright">
          © ${new Date().getFullYear()} ${company.name}. All Rights Reserved.<br>
          Helping you find the perfect property!
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};

export const leadFollowUpTemplate = (lead, company) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Property Follow-up • ${company.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        line-height: 1.7;
        color: #1a202c;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        min-height: 100vh;
        padding: 20px;
      }
      
      .email-container {
        max-width: 620px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .email-header {
        background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        padding: 40px 30px 30px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }
      
      .header-pattern {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        opacity: 0.1;
        background: radial-gradient(circle at 30% 20%, #a78bfa 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, #c4b5fd 0%, transparent 50%);
      }
      
      .logo-container {
        position: relative;
        z-index: 2;
        margin-bottom: 20px;
      }
      
      .logo {
        max-width: 180px;
        height: auto;
        filter: brightness(0) invert(1);
      }
      
      .header-title {
        color: white;
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 8px;
        position: relative;
        z-index: 2;
      }
      
      .header-subtitle {
        color: rgba(255, 255, 255, 0.8);
        font-size: 16px;
        font-weight: 400;
        position: relative;
        z-index: 2;
      }
      
      .email-body {
        padding: 50px 40px 40px;
      }
      
      .greeting {
        font-size: 28px;
        font-weight: 700;
        color: #7c3aed;
        text-align: center;
        margin-bottom: 16px;
      }
      
      .intro-message {
        text-align: center;
        color: #475569;
        font-size: 18px;
        margin-bottom: 40px;
        line-height: 1.8;
      }
      
      .property-highlight {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border: 2px solid #e2e8f0;
        border-radius: 20px;
        padding: 35px;
        margin: 40px 0;
        text-align: center;
        position: relative;
      }
      
      .highlight-badge {
        position: absolute;
        top: -15px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        padding: 8px 20px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
      }
      
      .property-name {
        color: #1e293b;
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 10px;
      }
      
      .property-location {
        color: #64748b;
        font-size: 16px;
        margin-bottom: 20px;
      }
      
      .property-price {
        color: #059669;
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 25px;
      }
      
      .action-buttons {
        display: flex;
        gap: 15px;
        justify-content: center;
        flex-wrap: wrap;
        margin: 30px 0;
      }
      
      .action-button {
        display: inline-block;
        padding: 14px 28px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 15px;
        text-decoration: none;
        transition: all 0.3s ease;
        text-align: center;
        min-width: 160px;
      }
      
      .primary-button {
        background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        color: white !important;
        box-shadow: 0 8px 25px -5px rgba(124, 58, 237, 0.4);
      }
      
      .secondary-button {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        color: white !important;
        box-shadow: 0 8px 25px -5px rgba(30, 41, 59, 0.4);
      }
      
      .action-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 35px -5px rgba(124, 58, 237, 0.5);
      }
      
      .similar-properties {
        background: linear-gradient(135deg, #fef7ed 0%, #fed7aa 100%);
        border: 1px solid #fdba74;
        border-radius: 16px;
        padding: 30px;
        margin: 30px 0;
      }
      
      .similar-title {
        color: #ea580c;
        font-weight: 600;
        margin-bottom: 16px;
        font-size: 20px;
        text-align: center;
      }
      
      .similar-text {
        color: #9a3412;
        font-size: 16px;
        line-height: 1.6;
        text-align: center;
        margin-bottom: 20px;
      }
      
      .expert-section {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border-radius: 16px;
        padding: 35px;
        margin: 30px 0;
        color: #e2e8f0;
        text-align: center;
      }
      
      .expert-title {
        color: #f8fafc;
        font-weight: 600;
        margin-bottom: 16px;
        font-size: 20px;
      }
      
      .expert-text {
        color: #94a3b8;
        font-size: 16px;
        line-height: 1.6;
        margin-bottom: 25px;
      }
      
      .expert-contact {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 20px;
        margin-top: 20px;
      }
      
      .contact-item {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin: 10px 0;
        color: #e2e8f0;
      }
      
      .email-footer {
        background: #0f172a;
        padding: 40px 30px;
        text-align: center;
        color: #94a3b8;
      }
      
      .footer-logo {
        max-width: 120px;
        height: auto;
        margin-bottom: 20px;
        opacity: 0.8;
      }
      
      .company-info {
        font-size: 14px;
        line-height: 1.6;
        margin-bottom: 20px;
      }
      
      .copyright {
        font-size: 12px;
        color: #64748b;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #334155;
      }
      
      @media (max-width: 600px) {
        .email-body {
          padding: 30px 20px;
        }
        
        .email-header {
          padding: 30px 20px 20px;
        }
        
        .header-title {
          font-size: 24px;
        }
        
        .action-buttons {
          flex-direction: column;
          align-items: center;
        }
        
        .action-button {
          width: 100%;
          max-width: 280px;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="email-header">
        <div class="header-pattern"></div>
        <div class="logo-container">
          <img src="${company.logo}" alt="${company.name}" class="logo">
        </div>
        <h1 class="header-title">More Properties for You! 🔍</h1>
        <p class="header-subtitle">Expanding your options</p>
      </div>
      
      <div class="email-body">
        <h2 class="greeting">Hello ${lead.firstName},</h2>
        
        <p class="intro-message">
          We noticed your interest in <strong>${lead.property.title}</strong> and wanted to share<br>
          some additional properties that might catch your eye!
        </p>
        
        <div class="property-highlight">
          <div class="highlight-badge">Featured Property</div>
          <div class="property-name">${lead.property.title}</div>
          <div class="property-location">📍 ${lead.property.location}</div>
          <div class="property-price">${lead.property.price}</div>
          
          <div class="action-buttons">
            <a href="${company.website}/properties/${lead.property._id}" class="action-button primary-button">
              View Details
            </a>
            <a href="tel:${company.phone}" class="action-button secondary-button">
              Schedule Viewing
            </a>
          </div>
        </div>
        
        <div class="similar-properties">
          <div class="similar-title">Explore Similar Properties</div>
          <p class="similar-text">
            Based on your interest, we think you might love these properties too!<br>
            Let us know which ones you'd like to see in person.
          </p>
        </div>
        
        <div class="expert-section">
          <div class="expert-title">Your Personal Property Expert</div>
          <p class="expert-text">
            Our dedicated team is ready to help you find the perfect property.<br>
            We'll handle all the details so you can focus on finding your dream space.
          </p>
          
          <div class="expert-contact">
            <div class="contact-item">
              <span>📞</span>
              <span><strong>Call:</strong> ${company.phone}</span>
            </div>
            <div class="contact-item">
              <span>✉️</span>
              <span><strong>Email:</strong> ${company.email}</span>
            </div>
            <div class="contact-item">
              <span>🕒</span>
              <span><strong>Available:</strong> Mon-Fri, 8AM-6PM</span>
            </div>
          </div>
        </div>
        
        <div style="text-align: center; margin: 40px 0;">
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            <strong>Ready to take the next step?</strong><br>
            Let's schedule your property tour and discuss your options!
          </p>
        </div>
      </div>
      
      <div class="email-footer">
        <img src="${company.logo}" alt="${company.name}" class="footer-logo">
        <div class="company-info">
          <p>${company.address}</p>
          <p>${company.phone} • <a href="mailto:${company.email}" style="color: #60a5fa; text-decoration: none;">${company.email}</a></p>
        </div>
        <div class="copyright">
          © ${new Date().getFullYear()} ${company.name}. All Rights Reserved.<br>
          Your journey to the perfect property starts here!
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};
export const rentReminderTemplate = (tenantData, daysRemaining, company) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rent Payment Reminder • ${company.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        line-height: 1.7;
        color: #1a202c;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        min-height: 100vh;
        padding: 20px;
      }
      
      .email-container {
        max-width: 620px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .email-header {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        padding: 40px 30px 30px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }
      
      .header-pattern {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        opacity: 0.1;
        background: radial-gradient(circle at 30% 20%, #fbbf24 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, #f59e0b 0%, transparent 50%);
      }
      
      .header-title {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 8px;
        position: relative;
        z-index: 2;
        color: white;
      }
      
      .header-subtitle {
        font-size: 16px;
        font-weight: 400;
        position: relative;
        z-index: 2;
        color: #fef3c7;
      }
      
      .email-body {
        padding: 50px 40px 40px;
      }
      
      .greeting {
        font-size: 28px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 16px;
      }
      
      .message {
        color: #475569;
        font-size: 16px;
        margin-bottom: 30px;
        line-height: 1.8;
      }
      
      .reminder-card {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border-radius: 20px;
        padding: 35px;
        margin: 30px 0;
        color: white;
      }
      
      .card-title {
        color: #60a5fa;
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 25px;
        text-align: center;
      }
      
      .details-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 25px;
      }
      
      .detail-item {
        text-align: center;
        padding: 15px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .detail-label {
        color: #94a3b8;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      }
      
      .detail-value {
        color: white;
        font-size: 16px;
        font-weight: 600;
      }
      
      .days-remaining {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        margin: 25px 0;
      }
      
      .days-number {
        color: white;
        font-size: 32px;
        font-weight: 700;
        font-family: 'Monaco', 'Consolas', monospace;
      }
      
      .payment-info {
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        border: 1px solid #bbf7d0;
        border-radius: 16px;
        padding: 30px;
        margin: 30px 0;
      }
      
      .info-title {
        color: #059669;
        font-weight: 600;
        margin-bottom: 16px;
        font-size: 18px;
      }
      
      .info-list {
        color: #065f46;
        list-style: none;
        padding: 0;
      }
      
      .info-list li {
        padding: 10px 0;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        border-bottom: 1px solid #bbf7d0;
      }
      
      .info-list li:last-child {
        border-bottom: none;
      }
      
      .info-list li::before {
        content: "💳";
        flex-shrink: 0;
        margin-top: 2px;
      }
      
      .cta-section {
        text-align: center;
        margin: 40px 0;
      }
      
      .cta-button {
        display: inline-block;
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        color: white !important;
        text-decoration: none;
        padding: 18px 45px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 18px;
        transition: all 0.3s ease;
        box-shadow: 0 8px 25px -5px rgba(5, 150, 105, 0.4);
        border: none;
        cursor: pointer;
      }
      
      .cta-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 35px -5px rgba(5, 150, 105, 0.5);
      }
      
      .email-footer {
        background: #0f172a;
        padding: 40px 30px;
        text-align: center;
        color: #94a3b8;
      }
      
      .company-info {
        font-size: 14px;
        line-height: 1.6;
        margin-bottom: 20px;
      }
      
      .copyright {
        font-size: 12px;
        color: #64748b;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #334155;
      }
      
      @media (max-width: 600px) {
        .email-body {
          padding: 30px 20px;
        }
        
        .email-header {
          padding: 30px 20px 20px;
        }
        
        .header-title {
          font-size: 24px;
        }
        
        .details-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="email-header">
        <div class="header-pattern"></div>
        <h1 class="header-title">Rent Payment Reminder ⏰</h1>
        <p class="header-subtitle">Friendly reminder from ${company.name}</p>
      </div>
      
      <div class="email-body">
        <h2 class="greeting">Hello, ${tenantData.fullName}!</h2>
        
        <p class="message">
          This is a friendly reminder that your rent payment for <strong>${tenantData.propertyName}</strong> 
          is due in <strong>${daysRemaining} days</strong>. Please ensure timely payment to avoid any late fees.
        </p>
        
        <div class="reminder-card">
          <div class="card-title">Rent Payment Details</div>
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Property</div>
              <div class="detail-value">${tenantData.propertyName}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Unit</div>
              <div class="detail-value">${tenantData.unitNumber}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Floor</div>
              <div class="detail-value">${tenantData.floor}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Monthly Rent</div>
              <div class="detail-value">KSh ${tenantData.monthlyRent?.toLocaleString()}</div>
            </div>
          </div>
          
          <div class="days-remaining">
            <div style="color: #fef3c7; font-size: 14px; margin-bottom: 8px;">Days Remaining to Pay</div>
            <div class="days-number">${daysRemaining} Days</div>
          </div>
        </div>
      </div>
      
      <div class="email-footer">
        <div class="company-info">
          <p>${company.address}</p>
          <p>${company.phone} • <a href="mailto:${company.accountsEmail}" style="color: #60a5fa; text-decoration: none;">${company.accountsEmail}</a></p>
        </div>
        <div class="copyright">
          © ${new Date().getFullYear()} ${company.name}. All Rights Reserved.<br>
          Creating exceptional living experiences for you!
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};

export const rentOverdueTemplate = (tenantData, company) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rent Payment Overdue • ${company.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        line-height: 1.7;
        color: #1a202c;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        min-height: 100vh;
        padding: 20px;
      }
      
      .email-container {
        max-width: 620px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .email-header {
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        padding: 40px 30px 30px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }
      
      .header-pattern {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        opacity: 0.1;
        background: radial-gradient(circle at 30% 20%, #f87171 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, #dc2626 0%, transparent 50%);
      }
      
      .header-title {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 8px;
        position: relative;
        z-index: 2;
        color: white;
      }
      
      .header-subtitle {
        font-size: 16px;
        font-weight: 400;
        position: relative;
        z-index: 2;
        color: #fecaca;
      }
      
      .email-body {
        padding: 50px 40px 40px;
      }
      
      .greeting {
        font-size: 28px;
        font-weight: 700;
        color: #dc2626;
        margin-bottom: 16px;
      }
      
      .urgent-message {
        background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        border: 2px solid #fecaca;
        border-radius: 16px;
        padding: 25px;
        margin: 20px 0;
        color: #dc2626;
        font-weight: 600;
        text-align: center;
        font-size: 18px;
      }
      
      .message {
        color: #475569;
        font-size: 16px;
        margin-bottom: 30px;
        line-height: 1.8;
      }
      
      .overdue-card {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border-radius: 20px;
        padding: 35px;
        margin: 30px 0;
        color: white;
      }
      
      .card-title {
        color: #f87171;
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 25px;
        text-align: center;
      }
      
      .details-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 25px;
      }
      
      .detail-item {
        text-align: center;
        padding: 15px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .detail-label {
        color: #94a3b8;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      }
      
      .detail-value {
        color: white;
        font-size: 16px;
        font-weight: 600;
      }
      
      .penalty-warning {
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        margin: 25px 0;
      }
      
      .penalty-text {
        color: white;
        font-size: 18px;
        font-weight: 600;
      }
      
      .payment-info {
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        border: 1px solid #bbf7d0;
        border-radius: 16px;
        padding: 30px;
        margin: 30px 0;
      }
      
      .info-title {
        color: #059669;
        font-weight: 600;
        margin-bottom: 16px;
        font-size: 18px;
      }
      
      .info-list {
        color: #065f46;
        list-style: none;
        padding: 0;
      }
      
      .info-list li {
        padding: 10px 0;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        border-bottom: 1px solid #bbf7d0;
      }
      
      .info-list li:last-child {
        border-bottom: none;
      }
      
      .info-list li::before {
        content: "💳";
        flex-shrink: 0;
        margin-top: 2px;
      }
      
      .cta-section {
        text-align: center;
        margin: 40px 0;
      }
      
      .cta-button {
        display: inline-block;
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        color: white !important;
        text-decoration: none;
        padding: 18px 45px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 18px;
        transition: all 0.3s ease;
        box-shadow: 0 8px 25px -5px rgba(220, 38, 38, 0.4);
        border: none;
        cursor: pointer;
      }
      
      .cta-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 35px -5px rgba(220, 38, 38, 0.5);
      }
      
      .email-footer {
        background: #0f172a;
        padding: 40px 30px;
        text-align: center;
        color: #94a3b8;
      }
      
      .company-info {
        font-size: 14px;
        line-height: 1.6;
        margin-bottom: 20px;
      }
      
      .copyright {
        font-size: 12px;
        color: #64748b;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #334155;
      }
      
      @media (max-width: 600px) {
        .email-body {
          padding: 30px 20px;
        }
        
        .email-header {
          padding: 30px 20px 20px;
        }
        
        .header-title {
          font-size: 24px;
        }
        
        .details-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="email-header">
        <div class="header-pattern"></div>
        <h1 class="header-title">Rent Payment Overdue 🚨</h1>
        <p class="header-subtitle">Immediate Action Required • ${company.name}</p>
      </div>
      
      <div class="email-body">
        <h2 class="greeting">Urgent: ${tenantData.fullName}</h2>
        
        <div class="urgent-message">
          ⚠️ YOUR RENT PAYMENT IS NOW OVERDUE ⚠️
        </div>
        
        <p class="message">
          Your rent payment for <strong>${tenantData.propertyName}</strong> was due and has not been received. 
          <strong>Immediate payment is required</strong> to avoid penalties and potential legal action.
        </p>
        
        <div class="overdue-card">
          <div class="card-title">Overdue Payment Details</div>
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Property</div>
              <div class="detail-value">${tenantData.propertyName}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Unit</div>
              <div class="detail-value">${tenantData.unitNumber}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Floor</div>
              <div class="detail-value">${tenantData.floor}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Monthly Rent</div>
              <div class="detail-value">KSh ${tenantData.monthlyRent?.toLocaleString()}</div>
            </div>
          </div>
          
          <div class="penalty-warning">
            <div class="penalty-text">
              ⚠️ Late Payment Penalty: KSh ${(tenantData.monthlyRent * 0.1).toLocaleString()} will be applied if not paid within 5 days
            </div>
          </div>
        </div>
      </div>
      
      <div class="email-footer">
        <div class="company-info">
          <p>${company.address}</p>
          <p>${company.phone} • <a href="mailto:${company.accountsEmail}" style="color: #60a5fa; text-decoration: none;">${company.accountsEmail}</a></p>
        </div>
        <div class="copyright">
          © ${new Date().getFullYear()} ${company.name}. All Rights Reserved.<br>
          Please contact us immediately if you have any payment issues.
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};

export const tenantWelcomeTemplate = (tenantData, company) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to ${tenantData.propertyName} • ${company.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        line-height: 1.7;
        color: #1a202c;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        min-height: 100vh;
        padding: 20px;
      }
      
      .email-container {
        max-width: 620px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .email-header {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        padding: 40px 30px 30px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }
      
      .header-pattern {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        opacity: 0.1;
        background: radial-gradient(circle at 30% 20%, #60a5fa 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, #3b82f6 0%, transparent 50%);
      }
      
      .header-title {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 8px;
        position: relative;
        z-index: 2;
        color: white;
      }
      
      .header-subtitle {
        font-size: 16px;
        font-weight: 400;
        position: relative;
        z-index: 2;
        color: #dbeafe;
      }
      
      .email-body {
        padding: 50px 40px 40px;
      }
      
      .greeting {
        font-size: 28px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 16px;
      }
      
      .welcome-message {
        color: #475569;
        font-size: 16px;
        margin-bottom: 30px;
        line-height: 1.8;
      }
      
      .property-card {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border-radius: 20px;
        padding: 35px;
        margin: 30px 0;
        color: white;
      }
      
      .card-title {
        color: #60a5fa;
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 25px;
        text-align: center;
      }
      
      .details-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 25px;
      }
      
      .detail-item {
        text-align: center;
        padding: 15px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .detail-label {
        color: #94a3b8;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      }
      
      .detail-value {
        color: white;
        font-size: 16px;
        font-weight: 600;
      }
      
      .deposit-info {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        border: 1px solid #fcd34d;
        border-radius: 16px;
        padding: 25px;
        margin: 25px 0;
        text-align: center;
      }
      
      .deposit-amount {
        color: #92400e;
        font-size: 24px;
        font-weight: 700;
        margin: 10px 0;
      }
      
      .move-in-guide {
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        border: 1px solid #bbf7d0;
        border-radius: 16px;
        padding: 30px;
        margin: 30px 0;
      }
      
      .guide-title {
        color: #059669;
        font-weight: 600;
        margin-bottom: 16px;
        font-size: 18px;
      }
      
      .guide-list {
        color: #065f46;
        list-style: none;
        padding: 0;
      }
      
      .guide-list li {
        padding: 10px 0;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        border-bottom: 1px solid #bbf7d0;
      }
      
      .guide-list li:last-child {
        border-bottom: none;
      }
      
      .guide-list li::before {
        content: "✅";
        flex-shrink: 0;
        margin-top: 2px;
      }
      
      .cta-section {
        text-align: center;
        margin: 40px 0;
      }
      
      .cta-button {
        display: inline-block;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white !important;
        text-decoration: none;
        padding: 18px 45px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 18px;
        transition: all 0.3s ease;
        box-shadow: 0 8px 25px -5px rgba(59, 130, 246, 0.4);
        border: none;
        cursor: pointer;
      }
      
      .cta-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 35px -5px rgba(59, 130, 246, 0.5);
      }
      
      .email-footer {
        background: #0f172a;
        padding: 40px 30px;
        text-align: center;
        color: #94a3b8;
      }
      
      .company-info {
        font-size: 14px;
        line-height: 1.6;
        margin-bottom: 20px;
      }
      
      .copyright {
        font-size: 12px;
        color: #64748b;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #334155;
      }
      
      @media (max-width: 600px) {
        .email-body {
          padding: 30px 20px;
        }
        
        .email-header {
          padding: 30px 20px 20px;
        }
        
        .header-title {
          font-size: 24px;
        }
        
        .details-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="email-header">
        <div class="header-pattern"></div>
        <h1 class="header-title">Welcome to ${tenantData.propertyName}! 🏠</h1>
        <p class="header-subtitle">Your new home with ${company.name}</p>
      </div>
      
      <div class="email-body">
        <h2 class="greeting">Hello, ${tenantData.fullName}!</h2>
        
        <p class="welcome-message">
          Welcome to your new home at <strong>${tenantData.propertyName}</strong>! 
          We're thrilled to have you as part of our community and look forward to 
          providing you with an exceptional living experience.
        </p>
        
        <div class="property-card">
          <div class="card-title">Your New Home Details</div>
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Property</div>
              <div class="detail-value">${tenantData.propertyName}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Unit Number</div>
              <div class="detail-value">${tenantData.unitNumber}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Floor</div>
              <div class="detail-value">${tenantData.floor}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Monthly Rent</div>
              <div class="detail-value">KSh ${tenantData.monthlyRent?.toLocaleString()}</div>
            </div>
          </div>
          
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Lease Start</div>
              <div class="detail-value">${new Date(tenantData.leaseStart).toLocaleDateString()}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Lease End</div>
              <div class="detail-value">${new Date(tenantData.leaseEnd).toLocaleDateString()}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Status</div>
              <div class="detail-value" style="color: #4ade80;">Active</div>
            </div>
          </div>
        </div>
        
        <div class="deposit-info">
          <div style="color: #92400e; font-size: 14px; margin-bottom: 5px;">Deposit Paid</div>
          <div class="deposit-amount">KSh ${tenantData.depositAmount?.toLocaleString()}</div>
          <div style="color: #92400e; font-size: 14px;">Covering ${tenantData.depositMonths} month(s)</div>
        </div>
        
        <div class="cta-section">
          <p style="color: #475569; font-size: 16px; margin-bottom: 20px; line-height: 1.6;">
            We're committed to making your stay comfortable and enjoyable.<br>
            Don't hesitate to reach out if you need anything!
          </p>
          <a href="tel:${company.phone}" class="cta-button">Contact</a>
        </div>
      </div>
      
      <div class="email-footer">
        <div class="company-info">
          <p>${company.address}</p>
          <p>${company.phone} • <a href="mailto:${company.email}" style="color: #60a5fa; text-decoration: none;">${company.email}</a></p>
        </div>
        <div class="copyright">
          © ${new Date().getFullYear()} ${company.name}. All Rights Reserved.<br>
          Creating exceptional living experiences for you!
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};

export const paymentConfirmationTemplate = (paymentData, company) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Confirmed • ${company.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        line-height: 1.7;
        color: #1a202c;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        min-height: 100vh;
        padding: 20px;
      }
      
      .email-container {
        max-width: 620px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .email-header {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        padding: 40px 30px 30px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }
      
      .header-pattern {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        opacity: 0.1;
        background: radial-gradient(circle at 30% 20%, #34d399 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, #10b981 0%, transparent 50%);
      }
      
      .header-title {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 8px;
        position: relative;
        z-index: 2;
        color: white;
      }
      
      .header-subtitle {
        font-size: 16px;
        font-weight: 400;
        position: relative;
        z-index: 2;
        color: #d1fae5;
      }
      
      .email-body {
        padding: 50px 40px 40px;
      }
      
      .success-icon {
        text-align: center;
        margin-bottom: 20px;
      }
      
      .success-circle {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4);
      }
      
      .greeting {
        font-size: 28px;
        font-weight: 700;
        color: #059669;
        text-align: center;
        margin-bottom: 16px;
      }
      
      .confirmation-message {
        color: #475569;
        font-size: 16px;
        margin-bottom: 30px;
        line-height: 1.8;
        text-align: center;
      }
      
      .payment-card {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border-radius: 20px;
        padding: 35px;
        margin: 30px 0;
        color: white;
      }
      
      .card-title {
        color: #60a5fa;
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 25px;
        text-align: center;
      }
      
      .details-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 25px;
      }
      
      .detail-item {
        text-align: center;
        padding: 15px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .detail-label {
        color: #94a3b8;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      }
      
      .detail-value {
        color: white;
        font-size: 16px;
        font-weight: 600;
      }
      
      .receipt-section {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        border-radius: 12px;
        padding: 25px;
        text-align: center;
        margin: 25px 0;
      }
      
      .receipt-number {
        color: white;
        font-size: 24px;
        font-weight: 700;
        font-family: 'Monaco', 'Consolas', monospace;
        letter-spacing: 2px;
      }
      
      .period-covered {
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        border: 1px solid #bbf7d0;
        border-radius: 16px;
        padding: 25px;
        margin: 25px 0;
        text-align: center;
      }
      
      .period-title {
        color: #059669;
        font-weight: 600;
        margin-bottom: 10px;
        font-size: 18px;
      }
      
      .period-dates {
        color: #065f46;
        font-size: 20px;
        font-weight: 700;
      }
      
      .next-payment {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        border: 1px solid #fcd34d;
        border-radius: 16px;
        padding: 20px;
        margin: 25px 0;
        text-align: center;
      }
      
      .next-payment-text {
        color: #92400e;
        font-size: 16px;
        font-weight: 600;
      }
      
      .thank-you {
        text-align: center;
        margin: 40px 0 20px;
        color: #475569;
        font-size: 18px;
        font-weight: 600;
      }
      
      .email-footer {
        background: #0f172a;
        padding: 40px 30px;
        text-align: center;
        color: #94a3b8;
      }
      
      .company-info {
        font-size: 14px;
        line-height: 1.6;
        margin-bottom: 20px;
      }
      
      .copyright {
        font-size: 12px;
        color: #64748b;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #334155;
      }
      
      @media (max-width: 600px) {
        .email-body {
          padding: 30px 20px;
        }
        
        .email-header {
          padding: 30px 20px 20px;
        }
        
        .header-title {
          font-size: 24px;
        }
        
        .details-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="email-header">
        <div class="header-pattern"></div>
        <h1 class="header-title">Payment Confirmed! ✅</h1>
        <p class="header-subtitle">Thank you for your payment • ${company.name}</p>
      </div>
      
      <div class="email-body">
        <div class="success-icon">
          <div class="success-circle">
            <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24" color="white">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        </div>
        
        <h2 class="greeting">Thank You, ${paymentData.tenantName}!</h2>
        
        <p class="confirmation-message">
          Your rent payment has been successfully processed and confirmed. 
          We appreciate your timely payment for <strong>${paymentData.propertyName}</strong>.
        </p>
        
        <div class="payment-card">
          <div class="card-title">Payment Details</div>
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Property</div>
              <div class="detail-value">${paymentData.propertyName}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Unit</div>
              <div class="detail-value">${paymentData.unitNumber}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Payment Method</div>
              <div class="detail-value">${paymentData.paymentMethod}</div>
            </div>
          </div>
          
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Amount Paid</div>
              <div class="detail-value">KSh ${paymentData.amountPaid?.toLocaleString()}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Months Paid</div>
              <div class="detail-value">${paymentData.monthsPaid}</div>
            </div>
          </div>
        </div>
        
        <div class="receipt-section">
          <div style="color: #fef3c7; font-size: 14px; margin-bottom: 8px;">Official Receipt Number</div>
          <div class="receipt-number">${paymentData.transactionNumber}</div>
          <div style="color: #fef3c7; font-size: 12px; margin-top: 8px;">Date: ${new Date(paymentData.paymentDate).toLocaleDateString()}</div>
        </div>
        
        <div class="period-covered">
          <div class="period-title">Rent Period Covered</div>
          <div class="period-dates">
            ${new Date(paymentData.paymentStartDate).toLocaleDateString()} 
            - 
            ${new Date(paymentData.paymentEndDate).toLocaleDateString()}
          </div>
        </div>
        
        <div class="next-payment">
          <div class="next-payment-text">
            📅 Next Payment Due: ${new Date(paymentData.paymentEndDate).toLocaleDateString()}
          </div>
        </div>
        
        <div class="thank-you">
          Thank you for being a valued tenant! 🎉
        </div>
      </div>
      
      <div class="email-footer">
        <div class="company-info">
          <p>${company.address}</p>
          <p>${company.phone} • <a href="mailto:${company.accountsEmail}" style="color: #60a5fa; text-decoration: none;">${company.accountsEmail}</a></p>
        </div>
        <div class="copyright">
          © ${new Date().getFullYear()} ${company.name}. All Rights Reserved.<br>
          This receipt is computer generated and does not require a physical signature.
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};