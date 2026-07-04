import { Request, Response, NextFunction } from 'express';
import admin from '../utils/firebase.js';

export interface FirebaseUser {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
}

declare global {
  namespace Express {
    interface Request {
      firebaseUser?: FirebaseUser;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' },
    });
    return;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    req.firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
    };
    
    next();
  } catch (error) {
    console.error('Firebase Auth Error:', error);
    res.status(401).json({
      success: false,
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
    });
  }
};
