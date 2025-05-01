/**
 * Passwordless Authentication Library - Demo Application
 * 
 * This demo shows how to use the library to set up various authentication methods
 * in an Express application.
 * 
 * @copyright Copyright (c) 2024 Mahmoud Ashraf (SNO7E)
 * @license MIT
 * @version 1.0.0
 * @author Mahmoud Ashraf (SNO7E) <https://github.com/SNO7E-G>
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Setup middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up authentication mock functionality 
// (Since the actual library may not be fully compiled yet)
const authDemo = {
  sendMagicLink: async (email) => {
    console.log(`[DEMO] Magic link sent to: ${email}`);
    return { success: true, message: 'Magic link sent successfully (demo)' };
  },

  verifyMagicLink: async (token) => {
    console.log(`[DEMO] Verifying magic link with token: ${token}`);
    return { 
      success: true, 
      message: 'Magic link verified successfully (demo)',
      user: { id: 'user-demo-123', email: 'demo@example.com', verified: true },
      token: 'demo-jwt-token-123'
    };
  },

  sendEmailOTP: async (email) => {
    console.log(`[DEMO] Email OTP sent to: ${email}`);
    return { success: true, message: 'OTP sent successfully (demo)' };
  },

  sendSmsOTP: async (phone) => {
    console.log(`[DEMO] SMS OTP sent to: ${phone}`);
    return { success: true, message: 'OTP sent successfully (demo)' };
  },

  verifyOTP: async (email, phone, otp) => {
    console.log(`[DEMO] Verifying OTP: ${otp} for ${email || phone}`);
    return { 
      success: true, 
      message: 'OTP verified successfully (demo)',
      user: { id: 'user-demo-123', email: email || null, phone: phone || null, verified: true },
      token: 'demo-jwt-token-456'
    };
  },

  validateToken: (token) => {
    console.log(`[DEMO] Validating token: ${token}`);
    return { id: 'user-demo-123', email: 'demo@example.com' };
  },

  logout: async (token) => {
    console.log(`[DEMO] Logging out with token: ${token}`);
    return true;
  }
};

// Set up authentication routes
// Magic Link Authentication
app.post('/auth/magic-link', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
    });
  }
  
  const result = await authDemo.sendMagicLink(email);
  
  res.status(result.success ? 200 : 500).json(result);
});

// Email OTP Authentication
app.post('/auth/email-otp', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
    });
  }
  
  const result = await authDemo.sendEmailOTP(email);
  
  res.status(result.success ? 200 : 500).json(result);
});

// SMS OTP Authentication
app.post('/auth/sms-otp', async (req, res) => {
  const { phone } = req.body;
  
  if (!phone) {
    return res.status(400).json({
      success: false,
      message: 'Phone number is required',
    });
  }
  
  const result = await authDemo.sendSmsOTP(phone);
  
  res.status(result.success ? 200 : 500).json(result);
});

// Verify Magic Link
app.get('/verify', (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).send(`
      <html>
        <head>
          <title>Verification Failed</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; text-align: center; }
            .error { color: #e74c3c; }
          </style>
        </head>
        <body>
          <h1 class="error">Verification Failed</h1>
          <p>Invalid or missing token.</p>
        </body>
      </html>
    `);
  }
  
  // Show the verification page with JavaScript to call the API
  res.send(`
    <html>
      <head>
        <title>Verifying...</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; text-align: center; }
          .success { color: #27ae60; }
          .error { color: #e74c3c; }
          #loading { display: block; }
          #result { display: none; }
          #token { word-break: break-all; font-family: monospace; background: #f5f5f5; padding: 10px; border-radius: 3px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div id="loading">
          <h1>Verifying your login...</h1>
          <p>Please wait while we verify your login.</p>
        </div>
        <div id="result"></div>
        <script>
          fetch('/auth/verify-magic-link', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: "${token}"
            })
          })
          .then(response => response.json())
          .then(data => {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('result').style.display = 'block';
            
            if (data.success) {
              document.getElementById('result').innerHTML = \`
                <h1 class="success">Successfully Verified!</h1>
                <p>You have been successfully authenticated.</p>
                <p>Your session token:</p>
                <div id="token">\${data.token}</div>
                <p>You can now use this token for authenticated requests.</p>
              \`;
            } else {
              document.getElementById('result').innerHTML = \`
                <h1 class="error">Verification Failed</h1>
                <p>\${data.message}</p>
              \`;
            }
          })
          .catch(error => {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('result').style.display = 'block';
            document.getElementById('result').innerHTML = \`
              <h1 class="error">Verification Failed</h1>
              <p>An error occurred during verification.</p>
            \`;
          });
        </script>
      </body>
    </html>
  `);
});

// Verify Magic Link API
app.post('/auth/verify-magic-link', async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Token is required',
    });
  }
  
  const result = await authDemo.verifyMagicLink(token);
  
  res.status(result.success ? 200 : 400).json(result);
});

// Verify OTP
app.post('/auth/verify-otp', async (req, res) => {
  const { email, phone, otp } = req.body;
  
  if (!otp) {
    return res.status(400).json({
      success: false,
      message: 'OTP is required',
    });
  }
  
  if (!email && !phone) {
    return res.status(400).json({
      success: false,
      message: 'Either email or phone is required',
    });
  }
  
  const result = await authDemo.verifyOTP(email, phone, otp);
  
  res.status(result.success ? 200 : 400).json(result);
});

// Validate Token
app.post('/auth/validate-token', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header is required',
    });
  }
  
  const token = authHeader.split(' ')[1];
  const user = authDemo.validateToken(token);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    user,
  });
});

// Logout
app.post('/auth/logout', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header is required',
    });
  }
  
  const token = authHeader.split(' ')[1];
  const success = await authDemo.logout(token);
  
  res.status(success ? 200 : 400).json({
    success,
    message: success ? 'Successfully logged out' : 'Failed to logout',
  });
});

// Set up a basic landing page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Passwordless Authentication Demo</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 2rem; }
        h1 { color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; }
        .methods { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; margin-top: 2rem; }
        .method { background-color: #f9f9f9; border-radius: 6px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .method h3 { margin-top: 0; color: #3498db; }
        code { background-color: #f1f1f1; padding: 2px 5px; border-radius: 3px; font-family: monospace; font-size: 0.9em; }
        .form-group { margin-bottom: 1rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: bold; }
        input { width: 100%; padding: 0.5rem; font-size: 1rem; border: 1px solid #ddd; border-radius: 4px; }
        button { background-color: #3498db; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-size: 1rem; }
        button:hover { background-color: #2980b9; }
        .footer { margin-top: 2rem; font-size: 0.9rem; color: #7f8c8d; text-align: center; }
        #result { margin-top: 2rem; padding: 1rem; border-radius: 4px; display: none; }
      </style>
    </head>
    <body>
      <h1>Passwordless Authentication Demo</h1>
      <p>
        Welcome to the Passwordless Authentication Library demo. This application demonstrates various passwordless authentication methods.
      </p>
      
      <div class="methods">
        <div class="method">
          <h3>Magic Link Authentication</h3>
          <p>Login with a secure link sent to your email</p>
          <form id="magic-link-form">
            <div class="form-group">
              <label for="magic-link-email">Email:</label>
              <input type="email" id="magic-link-email" required placeholder="your@email.com">
            </div>
            <button type="submit">Send Magic Link</button>
          </form>
        </div>
        
        <div class="method">
          <h3>Email OTP Authentication</h3>
          <p>Login with a one-time code sent to your email</p>
          <form id="email-otp-form">
            <div class="form-group">
              <label for="email-otp-email">Email:</label>
              <input type="email" id="email-otp-email" required placeholder="your@email.com">
            </div>
            <button type="submit">Send OTP</button>
          </form>
        </div>
        
        <div class="method">
          <h3>SMS OTP Authentication</h3>
          <p>Login with a one-time code sent to your phone</p>
          <form id="sms-otp-form">
            <div class="form-group">
              <label for="sms-otp-phone">Phone:</label>
              <input type="tel" id="sms-otp-phone" required placeholder="+1234567890">
            </div>
            <button type="submit">Send OTP</button>
          </form>
        </div>
        
        <div class="method">
          <h3>OTP Verification</h3>
          <p>Verify your OTP code</p>
          <form id="verify-otp-form">
            <div class="form-group">
              <label for="verify-identifier">Email or Phone:</label>
              <input type="text" id="verify-identifier" required placeholder="your@email.com or +1234567890">
            </div>
            <div class="form-group">
              <label for="verify-otp">OTP Code:</label>
              <input type="text" id="verify-otp" required placeholder="123456">
            </div>
            <button type="submit">Verify OTP</button>
          </form>
        </div>
      </div>
      
      <div id="result"></div>
      
      <div class="footer">
        <p>
          Passwordless Authentication Library — Copyright © 2024 Mahmoud Ashraf (SNO7E)
          <br>
          <a href="https://github.com/SNO7E-G" target="_blank">GitHub: @SNO7E-G</a>
        </p>
      </div>
      
      <script>
        // Handle Magic Link Form
        document.getElementById('magic-link-form').addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = document.getElementById('magic-link-email').value;
          await submitRequest('/auth/magic-link', { email });
        });
        
        // Handle Email OTP Form
        document.getElementById('email-otp-form').addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = document.getElementById('email-otp-email').value;
          await submitRequest('/auth/email-otp', { email });
        });
        
        // Handle SMS OTP Form
        document.getElementById('sms-otp-form').addEventListener('submit', async (e) => {
          e.preventDefault();
          const phone = document.getElementById('sms-otp-phone').value;
          await submitRequest('/auth/sms-otp', { phone });
        });
        
        // Handle OTP Verification Form
        document.getElementById('verify-otp-form').addEventListener('submit', async (e) => {
          e.preventDefault();
          const identifier = document.getElementById('verify-identifier').value;
          const otp = document.getElementById('verify-otp').value;
          
          const isEmail = identifier.includes('@');
          const payload = {
            otp,
            ...(isEmail ? { email: identifier } : { phone: identifier })
          };
          
          await submitRequest('/auth/verify-otp', payload);
        });
        
        // Generic request handler
        async function submitRequest(endpoint, data) {
          const resultDiv = document.getElementById('result');
          resultDiv.style.display = 'block';
          
          try {
            resultDiv.style.backgroundColor = '#f9f9f9';
            resultDiv.textContent = 'Sending request...';
            
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
              resultDiv.style.backgroundColor = '#d4edda';
              resultDiv.textContent = 'Success: ' + (result.message || 'Operation completed successfully');
              
              if (result.token) {
                resultDiv.textContent += '\\n\\nToken: ' + result.token;
                localStorage.setItem('authToken', result.token);
              }
            } else {
              resultDiv.style.backgroundColor = '#f8d7da';
              resultDiv.textContent = 'Error: ' + (result.message || 'Operation failed');
            }
          } catch (error) {
            resultDiv.style.backgroundColor = '#f8d7da';
            resultDiv.textContent = 'Error: ' + (error.message || 'Something went wrong');
          }
        }
      </script>
    </body>
    </html>
  `);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Passwordless Authentication Demo running on http://localhost:${PORT}`);
  console.log(`Copyright © 2024 Mahmoud Ashraf (SNO7E)`);
}); 