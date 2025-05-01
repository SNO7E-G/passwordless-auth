#!/bin/bash

#
# Passwordless Authentication Library - Setup Script
#
# @copyright Copyright (c) 2024 Mahmoud Ashraf (SNO7E)
# @license MIT
# @version 1.0.0
# @author Mahmoud Ashraf (SNO7E) <https://github.com/SNO7E-G>
#

echo "Setting up Passwordless Authentication Library..."
echo "Copyright (c) 2024 Mahmoud Ashraf (SNO7E)"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cat > .env << 'EOL'
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
EOL
  echo ".env file created successfully!"
else
  echo ".env file already exists, skipping..."
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the project
echo "Building the project..."
npm run build

echo ""
echo "Setup complete! You can run the server with:"
echo "npm start"
echo ""
echo "Or for development mode:"
echo "npm run dev" 