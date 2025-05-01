# Integration Guide

This guide provides detailed instructions for integrating the Passwordless Authentication Library with various frameworks and platforms.

## Table of Contents

- [Express.js Integration](#expressjs-integration)
- [React Integration](#react-integration)
- [React Native Integration](#react-native-integration)
- [Next.js Integration](#nextjs-integration)
- [Vue.js Integration](#vuejs-integration)
- [Angular Integration](#angular-integration)
- [Database Integrations](#database-integrations)
  - [MongoDB Integration](#mongodb-integration)
  - [PostgreSQL Integration](#postgresql-integration)
  - [Custom Storage Adapter](#custom-storage-adapter)

## Express.js Integration

The library includes built-in Express.js integration to easily add authentication to your Express application.

### Basic Setup

```typescript
import express from 'express';
import { express as passwordlessExpress } from 'passwordless-auth';

const app = express();
app.use(express.json());

// Create and use the authentication router
const authRouter = passwordlessExpress.createAuthRouter({
  // Options
  emailVerificationRequired: true,
  baseUrl: 'https://your-app.com',
  redirectUrl: 'https://your-app.com/auth/callback',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: '1d'
});

// Mount the authentication router
app.use('/auth', authRouter);

// Protect routes using the authentication middleware
app.get('/protected', 
  passwordlessExpress.requireAuth(), 
  (req, res) => {
    res.json({ user: req.user, message: 'This is a protected route' });
  }
);

// Optional authentication middleware
app.get('/optional-auth',
  passwordlessExpress.optionalAuth(),
  (req, res) => {
    if (req.user) {
      res.json({ user: req.user, message: 'User is authenticated' });
    } else {
      res.json({ message: 'User is not authenticated' });
    }
  }
);

// Rate limiting middleware
app.use('/auth',
  passwordlessExpress.rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
  })
);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Custom Authentication Routes

If you prefer more control over your authentication routes, you can integrate the services directly:

```typescript
import express from 'express';
import { authService, emailService } from 'passwordless-auth';

const app = express();
app.use(express.json());

// Magic Link Authentication
app.post('/auth/magic-link', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
    });
  }
  
  try {
    const result = await authService.sendMagicLink(email, {
      redirectUrl: 'https://your-app.com/auth/callback',
      expiresIn: 15 * 60 * 1000 // 15 minutes
    });
    
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Verify Magic Link
app.post('/auth/verify-magic-link', async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Token is required',
    });
  }
  
  try {
    const result = await authService.verifyMagicLink(token);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided',
    });
  }
  
  const user = authService.validateToken(token);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
  
  req.user = user;
  next();
};

// Protected route
app.get('/protected', verifyToken, (req, res) => {
  res.json({
    success: true,
    user: req.user,
    message: 'This is a protected route',
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## React Integration

### Installation

```bash
npm install passwordless-auth react-passwordless-auth
```

### Setup Authentication Provider

```tsx
// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { AuthProvider } from 'react-passwordless-auth';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

const App: React.FC = () => {
  return (
    <AuthProvider
      apiUrl="https://your-api.com/auth"
      storageKey="auth_token"
      autoRefresh={true}
    >
      <Router>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/dashboard" component={Dashboard} />
        </Switch>
      </Router>
    </AuthProvider>
  );
};

export default App;
```

### Magic Link Authentication

```tsx
// src/pages/Login.tsx
import React, { useState } from 'react';
import { useMagicLink } from 'react-passwordless-auth';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const { sendMagicLink, loading, error, success } = useMagicLink();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMagicLink(email, {
      redirectUrl: window.location.origin + '/auth/callback',
    });
  };

  return (
    <div>
      <h1>Login</h1>
      {success && <p>Magic link has been sent to your email!</p>}
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Login with Magic Link'}
        </button>
      </form>
    </div>
  );
};

export default Login;
```

### OTP Authentication

```tsx
// src/pages/OtpLogin.tsx
import React, { useState } from 'react';
import { useOtp } from 'react-passwordless-auth';

const OtpLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const { sendOtp, verifyOtp, loading, error } = useOtp();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await sendOtp(email);
    if (result.success) {
      setOtpSent(true);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    await verifyOtp(email, undefined, otp);
  };

  return (
    <div>
      <h1>Login with OTP</h1>
      {error && <p className="error">{error}</p>}
      
      {!otpSent ? (
        <form onSubmit={handleSendOtp}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
      )}
    </div>
  );
};

export default OtpLogin;
```

### Protected Routes

```tsx
// src/components/PrivateRoute.tsx
import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { useAuth } from 'react-passwordless-auth';

interface PrivateRouteProps extends RouteProps {
  component: React.ComponentType<any>;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  component: Component,
  ...rest
}) => {
  const { isAuthenticated, loading } = useAuth();

  return (
    <Route
      {...rest}
      render={(props) =>
        loading ? (
          <div>Loading...</div>
        ) : isAuthenticated ? (
          <Component {...props} />
        ) : (
          <Redirect
            to={{
              pathname: '/login',
              state: { from: props.location },
            }}
          />
        )
      }
    />
  );
};

export default PrivateRoute;
```

## React Native Integration

### Setup Authentication Provider

```tsx
// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider } from 'react-native-passwordless-auth';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';

const Stack = createStackNavigator();

const App: React.FC = () => {
  return (
    <AuthProvider
      apiUrl="https://your-api.com/auth"
      storageKey="auth_token"
      autoRefresh={true}
    >
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
};

export default App;
```

### Magic Link Authentication

```tsx
// screens/LoginScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert, Linking } from 'react-native';
import { useMagicLink } from 'react-native-passwordless-auth';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const { sendMagicLink, loading, error } = useMagicLink();

  // Set up deep linking for magic link
  React.useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const { url } = event;
      // Parse the URL and extract the token
      // Then verify the token
    };

    Linking.addEventListener('url', handleDeepLink);
    return () => Linking.removeEventListener('url', handleDeepLink);
  }, []);

  const handleSubmit = async () => {
    const result = await sendMagicLink(email, {
      redirectUrl: 'your-app-scheme://auth/callback',
    });
    
    if (result.success) {
      Alert.alert('Success', 'Magic link has been sent to your email!');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email address"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Button
        title={loading ? 'Sending...' : 'Login with Magic Link'}
        onPress={handleSubmit}
        disabled={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
});

export default LoginScreen;
```

## Next.js Integration

### Setup Authentication Provider

```tsx
// pages/_app.tsx
import React from 'react';
import { AppProps } from 'next/app';
import { AuthProvider } from 'next-passwordless-auth';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider
      apiUrl="/api/auth"
      storageKey="auth_token"
      autoRefresh={true}
    >
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;
```

### API Routes for Authentication

```typescript
// pages/api/auth/magic-link.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { authService } from 'passwordless-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const result = await authService.sendMagicLink(email, {
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
      expiresIn: 15 * 60 * 1000, // 15 minutes
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
```

### Middleware for Protected Routes

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authService } from 'passwordless-auth';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const user = authService.validateToken(token);
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*'],
};
```

## Database Integrations

### MongoDB Integration

The library provides a built-in MongoDB adapter for data storage:

```typescript
import { storageService } from 'passwordless-auth';
import { MongoDbAdapter } from 'passwordless-auth/adapters';

// Initialize MongoDB adapter
const mongoAdapter = new MongoDbAdapter({
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/passwordless-auth',
  userCollection: 'users',
  tokenCollection: 'tokens',
  sessionCollection: 'sessions',
});

// Configure storage service to use MongoDB adapter
storageService.useAdapter(mongoAdapter);

// Connect to MongoDB
(async () => {
  try {
    await storageService.connect();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
})();
```

### PostgreSQL Integration

For PostgreSQL integration, you can create a custom adapter:

```typescript
import { StorageAdapter } from 'passwordless-auth';
import { Pool } from 'pg';

class PostgresAdapter implements StorageAdapter {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
    });
  }

  async connect(): Promise<void> {
    // Test the connection
    const client = await this.pool.connect();
    client.release();
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
  }

  async findUserById(id: string): Promise<any> {
    const { rows } = await this.pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }

  async findUserByEmail(email: string): Promise<any> {
    const { rows } = await this.pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  }

  // Implement other StorageAdapter methods...
}

// Use the PostgreSQL adapter
import { storageService } from 'passwordless-auth';

const postgresAdapter = new PostgresAdapter(
  process.env.POSTGRES_URL || 'postgresql://localhost:5432/passwordless_auth'
);

storageService.useAdapter(postgresAdapter);

// Connect to PostgreSQL
(async () => {
  try {
    await storageService.connect();
    console.log('Connected to PostgreSQL');
  } catch (error) {
    console.error('Failed to connect to PostgreSQL:', error);
  }
})();
```

### Custom Storage Adapter

You can implement a custom storage adapter for any database by implementing the `StorageAdapter` interface:

```typescript
import { StorageAdapter } from 'passwordless-auth';

class CustomStorageAdapter implements StorageAdapter {
  constructor(options: any) {
    // Initialize your storage connection
  }

  async connect(): Promise<void> {
    // Connect to your storage
  }

  async disconnect(): Promise<void> {
    // Disconnect from your storage
  }

  async findUserById(id: string): Promise<any> {
    // Implement user lookup by ID
  }

  async findUserByEmail(email: string): Promise<any> {
    // Implement user lookup by email
  }

  async findUserByPhone(phone: string): Promise<any> {
    // Implement user lookup by phone
  }

  async createUser(userData: any): Promise<any> {
    // Implement user creation
  }

  async updateUser(id: string, updates: any): Promise<any> {
    // Implement user update
  }

  // Implement token methods
  async findTokenById(id: string): Promise<any> { /* ... */ }
  async findTokenByToken(token: string): Promise<any> { /* ... */ }
  async createToken(tokenData: any): Promise<any> { /* ... */ }
  async updateToken(id: string, updates: any): Promise<any> { /* ... */ }

  // Implement session methods
  async findSessionById(id: string): Promise<any> { /* ... */ }
  async findSessionByToken(token: string): Promise<any> { /* ... */ }
  async createSession(sessionData: any): Promise<any> { /* ... */ }
  async updateSession(id: string, updates: any): Promise<any> { /* ... */ }
  async deleteSession(id: string): Promise<boolean> { /* ... */ }
}

// Use the custom adapter
import { storageService } from 'passwordless-auth';

const customAdapter = new CustomStorageAdapter({
  // Custom options
});

storageService.useAdapter(customAdapter);
``` 