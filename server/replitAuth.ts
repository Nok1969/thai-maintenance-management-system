import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Get domains with safe fallback for development
const getDomains = () => {
  if (process.env.REPLIT_DOMAINS) {
    return process.env.REPLIT_DOMAINS.split(",");
  }
  
  // Fallback for development
  if (process.env.NODE_ENV === 'development') {
    return ["localhost:5000"];
  }
  
  throw new Error("REPLIT_DOMAINS must be set in production");
};

const getOidcConfig = memoize(
  async () => {
    const issuerUrl = process.env.ISSUER_URL ?? "https://replit.com/oidc";
    const replId = process.env.REPL_ID;
    
    if (!replId && process.env.NODE_ENV !== 'development') {
      throw new Error("REPL_ID must be set in production");
    }
    
    // Use a fallback ID for development
    const clientId = replId || "dev-fallback-id";
    
    return await client.discovery(
      new URL(issuerUrl),
      clientId
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // Get session secret with fallback
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error("SESSION_SECRET must be set in production");
    }
    console.warn("Warning: Using fallback SESSION_SECRET for development");
  }
  
  const secret = sessionSecret || "dev-session-secret-change-in-production";
  
  // Database URL is already checked in db.ts, but add fallback handling
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
  }
  
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: dbUrl,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // Prevent XSS attacks
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // CSRF protection
      maxAge: sessionTtl,
      // Additional security for production
      ...(process.env.NODE_ENV === 'production' && {
        domain: process.env.COOKIE_DOMAIN, // Set if using custom domain
      })
    },
    // Enhanced session security
    name: process.env.NODE_ENV === 'production' ? 'sessionId' : 'connect.sid', // Hide default session name
    rolling: true, // Extend session on activity
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Skip OIDC setup in development if no proper config
  if (process.env.NODE_ENV === 'development' && !process.env.REPL_ID) {
    console.log('Development mode: Skipping OIDC setup');
    
    // Add mock authentication for development
    passport.serializeUser((user: any, cb) => cb(null, user));
    passport.deserializeUser((user: any, cb) => cb(null, user));
    
    // Mock login route for development
    app.get("/api/login", (req, res) => {
      res.redirect("/");
    });
    
    app.get("/api/logout", (req, res) => {
      res.redirect("/");
    });
    
    return;
  }

  let config;
  try {
    config = await getOidcConfig();
  } catch (error) {
    console.error("OIDC discovery failed:", error);
    throw new Error("Failed to configure OIDC. Authentication will not work.");
  }

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    
    // Only upsert user on fresh login, not on token refresh
    // This is called only during OAuth callback, not during isAuthenticated middleware
    await upsertUser(tokens.claims());
    
    verified(null, user);
  };

  const domains = getDomains();
  for (const domain of domains) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    const domains = getDomains();
    const domain = domains[0]; // Use the first domain
    passport.authenticate(`replitauth:${domain}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    const domains = getDomains();
    const domain = domains[0]; // Use the first domain
    passport.authenticate(`replitauth:${domain}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", async (req, res) => {
    const replId = process.env.REPL_ID || "dev-fallback-id";
    
    let logoutUrl;
    try {
      // Get fresh config for logout (use cached version)
      const logoutConfig = await getOidcConfig();
      logoutUrl = client.buildEndSessionUrl(logoutConfig, {
        client_id: replId,
        post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
      }).href;
    } catch (configError) {
      console.error("OIDC config failed during logout:", configError);
      // Fallback: simple redirect to home without OIDC logout
      logoutUrl = `${req.protocol}://${req.hostname}`;
    }

    // Handle different Express versions and logout methods
    try {
      if (typeof req.logout === "function") {
        // Express 5+ style with callback
        if (req.logout.length > 0) {
          req.logout(() => {
            res.redirect(logoutUrl);
          });
        } else {
          // Express 4 style synchronous
          req.logout(() => {});
          res.redirect(logoutUrl);
        }
      } else if (req.session) {
        // Fallback: destroy session manually
        req.session.destroy((err) => {
          if (err) {
            console.error("Session destroy error:", err);
          }
          res.redirect(logoutUrl);
        });
      } else {
        // Last resort: just redirect
        res.redirect(logoutUrl);
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails, redirect to complete the process
      res.redirect(logoutUrl);
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Development mode: Skip authentication
  if (process.env.NODE_ENV === 'development' && !process.env.REPL_ID) {
    // Mock user for development
    req.user = {
      claims: { sub: "dev-user-123" },
      access_token: "dev-token",
      expires_at: Math.floor(Date.now() / 1000) + 3600
    };
    return next();
  }

  const user = req.user as any;

  if (!user || !req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    let config;
    try {
      config = await getOidcConfig();
    } catch (configError) {
      console.error("OIDC config failed during token refresh:", configError);
      return res.status(500).json({ message: "Authentication service unavailable" });
    }
    
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    
    // Only update session tokens, do NOT upsert user data
    // User data should only be updated on fresh login, not on token refresh
    updateUserSession(user, tokenResponse);
    
    return next();
  } catch (error) {
    console.error("Token refresh failed:", error);
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
