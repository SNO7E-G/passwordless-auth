#
# Passwordless Authentication Library - Setup Script
#
# @copyright Copyright (c) 2024 Mahmoud Ashraf (SNO7E)
# @license MIT
# @version 1.0.0
# @author Mahmoud Ashraf (SNO7E) <https://github.com/SNO7E-G>
#

Write-Host "Setting up Passwordless Authentication Library..." -ForegroundColor Green
Write-Host "Copyright (c) 2024 Mahmoud Ashraf (SNO7E)" -ForegroundColor Cyan
Write-Host ""

# Create .env file if it doesn't exist
if (-not (Test-Path .env)) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    $envContent = @"
# Server
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000

# JWT
JWT_SECRET=development-secret-key
JWT_EXPIRES_IN=1d

# Database
STORAGE_TYPE=memory
MONGODB_URI=mongodb://localhost:27017/passwordless-auth

# Email (for magic links & email OTP)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=user@example.com
EMAIL_PASS=your-password
EMAIL_FROM=no-reply@example.com
EMAIL_PROVIDER=smtp

# SMS (for SMS OTP)
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Security
TOKEN_EXPIRY_MINUTES=15
MAGIC_LINK_EXPIRY_MINUTES=15
OTP_EXPIRY_MINUTES=5
OTP_LENGTH=6
OTP_ALGORITHM=sha1

# Localization
DEFAULT_LOCALE=en
SUPPORTED_LOCALES=en,es

# CORS
CORS_ORIGINS=http://localhost:3000
"@
    $envContent | Out-File -FilePath .env -Encoding utf8
    Write-Host ".env file created successfully!" -ForegroundColor Green
}
else {
    Write-Host ".env file already exists, skipping..." -ForegroundColor Yellow
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Build the project
Write-Host "Building the project..." -ForegroundColor Yellow
npm run build

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "You can run the server with:" -ForegroundColor Cyan
Write-Host "npm start" -ForegroundColor White
Write-Host ""
Write-Host "Or for development mode:" -ForegroundColor Cyan
Write-Host "npm run dev" -ForegroundColor White 