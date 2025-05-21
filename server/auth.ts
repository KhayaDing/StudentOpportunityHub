import bcrypt from 'bcryptjs';
import { storage } from './storage';
import { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import { z } from 'zod';

// Extend express-session types to include userId and role
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    role?: string;
  }
}

// Define session storage
const MemoryStoreSession = MemoryStore(session);

// Setup session middleware
export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'kimconnect-secret-key',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStoreSession({
    checkPeriod: 86400000, // prune expired entries every 24h
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
  },
});

// Register schema
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['student', 'employer', 'admin']).optional().default('student')
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

// Login handler
export const login = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: 'Invalid credentials format', errors: validation.error.format() });
    }
    
    const { email, password } = validation.data;
    
    // Find user
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      if (user.status === 'pending') {
        return res.status(401).json({ message: 'Your account is pending approval. Please check your email or contact support.' });
      }
      return res.status(401).json({ message: 'Your account is not active. Please contact support.' });
    }
    
    // Create session
    req.session.userId = String(user.id);
    req.session.role = user.role;
    
    // Return user info (without password)
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(200).json({ message: 'Login successful', user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Register handler
export const register = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: 'Invalid registration data', errors: validation.error.format() });
    }
    
    const { email, password, firstName, lastName, role } = validation.data;
    
    // Check if email already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    
    // Create new user
    const user = await storage.createUser({
      email,
      password,
      firstName,
      lastName,
      role,
      // Students are active by default, employers need approval
      status: role === 'employer' ? 'pending' : 'active',
    });
    
    // Create profile based on role
    if (role === 'student') {
      await storage.createStudentProfile({
        userId: user.id,
        isProfileVisible: true,
      });
    } else if (role === 'employer') {
      // Employer registration requires additional data
      const { companyName } = req.body;
      if (!companyName) {
        return res.status(400).json({ message: 'Company name is required for employer registration' });
      }
      
      await storage.createEmployerProfile({
        userId: user.id,
        companyName,
        isVerified: false,
      });
    }
    
    // Create session if student (auto-login)
    if (role === 'student') {
      req.session.userId = String(user.id);
      req.session.role = user.role;
    }
    
    // Return user info (without password)
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(201).json({ 
      message: role === 'employer' 
        ? 'Registration successful. Your account is pending approval.' 
        : 'Registration successful', 
      user: userWithoutPassword 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Logout handler
export const logout = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out' });
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Logged out successfully' });
  });
};

// Get current user handler
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const user = await storage.getUser(Number(userId));
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get profile based on role
    let profile;
    if (user.role === 'student') {
      profile = await storage.getStudentWithSkills(Number(userId));
    } else if (user.role === 'employer') {
      profile = await storage.getEmployerProfile(userId);
    }
    
    // Return user info (without password)
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(200).json({ 
      user: userWithoutPassword,
      profile
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error getting user data' });
  }
};

// Authentication middleware
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

// Role-based authorization middleware
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!roles.includes(req.session.role as string)) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    next();
  };
};
