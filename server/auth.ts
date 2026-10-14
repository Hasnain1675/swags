import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../src/lib/firebase-admin.ts';
import { db } from '../src/db/index.ts';
import { users } from '../src/db/schema.ts';
import { eq } from 'drizzle-orm';

export interface AuthenticatedUser {
  uid: string;
  name: string;
  email: string;
  role: 'citizen' | 'authority' | 'officer';
  departmentId?: number | null;
  phone?: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

// Built-in Pakistani demo personas for realistic testing
export const DEMO_USERS: Record<string, AuthenticatedUser> = {
  'demo:citizen': {
    uid: 'demo-citizen-ali',
    name: 'Muhammad Ali (Citizen)',
    email: 'm.ali@citizen.pk',
    role: 'citizen',
    departmentId: null,
    phone: '+92 300 8291044',
  },
  'demo:authority': {
    uid: 'demo-authority-tariq',
    name: 'DC Tariq Mehmood (Municipal Commissioner)',
    email: 'dc.tariq@punjab.gov.pk',
    role: 'authority',
    departmentId: null,
    phone: '+92 301 5554321',
  },
  'demo:officer': {
    uid: 'demo-officer-rashid',
    name: 'SDO Rashid Malik (Roads & C&W)',
    email: 'rashid.malik@cw.gov.pk',
    role: 'officer',
    departmentId: 1, // C&W / Roads & Infrastructure
    phone: '+92 321 4441199',
  },
  'demo:officer:water': {
    uid: 'demo-officer-hamza',
    name: 'Engr. Hamza Farooq (WASA / Water Agency)',
    email: 'hamza.farooq@wasa.gov.pk',
    role: 'officer',
    departmentId: 3, // WASA Water & Sanitation
    phone: '+92 333 9988112',
  },
};

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = DEMO_USERS['demo:citizen'];
    return next();
  }

  const token = authHeader.split('Bearer ')[1].trim();

  // 1. Check Demo Persona token
  if (DEMO_USERS[token]) {
    req.user = DEMO_USERS[token];
    return next();
  }

  // 2. Check Firebase ID Token
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const existing = await db.select().from(users).where(eq(users.uid, decoded.uid)).limit(1);
    if (existing.length > 0) {
      req.user = {
        uid: existing[0].uid,
        name: existing[0].name,
        email: existing[0].email,
        role: (existing[0].role as any) || 'citizen',
        departmentId: existing[0].departmentId,
      };
    } else {
      const newUser = {
        uid: decoded.uid,
        name: decoded.name || decoded.email?.split('@')[0] || 'Pakistani Citizen',
        email: decoded.email || 'citizen@pakistan.gov.pk',
        role: 'citizen' as const,
        departmentId: null,
      };
      await db.insert(users).values(newUser).onConflictDoNothing();
      req.user = newUser;
    }
    return next();
  } catch (err) {
    if (token.startsWith('demo:')) {
      const role = token.replace('demo:', '');
      if (role === 'authority' || role === 'officer' || role === 'citizen') {
        req.user = {
          uid: `demo-${role}`,
          name: `Officer (${role.toUpperCase()})`,
          email: `${role}@civicflow.pk`,
          role: role as any,
          departmentId: role === 'officer' ? 1 : null,
        };
        return next();
      }
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid authentication credentials' });
  }
};

export const requireRole = (allowedRoles: Array<'citizen' | 'authority' | 'officer'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: This action requires one of the following roles: ${allowedRoles.join(', ')}. Current role: ${req.user.role}`,
      });
    }
    next();
  };
};
