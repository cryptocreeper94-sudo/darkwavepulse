let firebaseAdmin: any = null;
let adminModule: any = null;
let initAttempted = false;

async function getFirebaseAdmin() {
  if (initAttempted && !firebaseAdmin) return null;
  
  if (!firebaseAdmin) {
    initAttempted = true;
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
    
    if (!projectId) {
      console.warn("[Firebase Admin] No project ID configured - token verification disabled");
      return null;
    }

    try {
      if (!adminModule) {
        const imported = await import("firebase-admin");
        adminModule = imported.default || imported;
      }
      
      const getApps = adminModule.getApps || (adminModule.default?.getApps);
      const initializeApp = adminModule.initializeApp || (adminModule.default?.initializeApp);
      const getApp = adminModule.getApp || (adminModule.default?.getApp);
      const cert = adminModule.credential?.cert || (adminModule.default?.credential?.cert);
      const applicationDefault = adminModule.credential?.applicationDefault || (adminModule.default?.credential?.applicationDefault);
      
      if (!initializeApp) {
        console.error("[Firebase Admin] initializeApp function not found in module");
        return null;
      }
      
      const apps = getApps ? getApps() : [];
      
      if (!apps.length) {
        const credentialsJson = process.env.FIREBASE_ADMIN_CREDENTIALS;
        
        if (credentialsJson && cert) {
          try {
            const serviceAccount = JSON.parse(credentialsJson);
            firebaseAdmin = initializeApp({
              credential: cert(serviceAccount),
              projectId,
            });
            console.log("[Firebase Admin] Initialized with service account for project:", projectId);
          } catch (parseError) {
            console.error("[Firebase Admin] Failed to parse credentials JSON:", parseError);
            return null;
          }
        } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS && applicationDefault) {
          firebaseAdmin = initializeApp({
            credential: applicationDefault(),
            projectId,
          });
          console.log("[Firebase Admin] Initialized with ADC for project:", projectId);
        } else {
          console.warn("[Firebase Admin] No credentials configured - using project ID only (limited functionality)");
          firebaseAdmin = initializeApp({ projectId });
        }
      } else {
        firebaseAdmin = getApp ? getApp() : apps[0];
      }
    } catch (error: any) {
      console.error("[Firebase Admin] Initialization error:", error.message);
      return null;
    }
  }
  return firebaseAdmin;
}

async function verifyFirebaseToken(token: string): Promise<any | null> {
  const app = await getFirebaseAdmin();
  if (!app || !adminModule) return null;

  try {
    const getAuth = adminModule.getAuth || (adminModule.default?.getAuth);
    if (!getAuth) {
      console.error("[Firebase Admin] getAuth function not found");
      return null;
    }
    const auth = getAuth(app);
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("[Firebase Auth] Token verification failed:", error);
    return null;
  }
}

function generateHallmarkId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`.toUpperCase();
}

export const firebaseAuthRoutes = [
  {
    path: "/api/auth/firebase-sync",
    method: "POST" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const authHeader = c.req.header("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return c.json({ error: "Missing authorization token" }, 401);
        }

        const token = authHeader.replace("Bearer ", "");
        const decodedToken = await verifyFirebaseToken(token);

        if (!decodedToken) {
          return c.json({ error: "Invalid token" }, 401);
        }

        const body = await c.req.json();
        const { uid, email, displayName, photoURL } = body;

        if (decodedToken.uid !== uid) {
          return c.json({ error: "Token mismatch" }, 401);
        }

        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
          logger?.info("[Firebase Auth] No database, returning default config");
          return c.json({ 
            success: true, 
            userConfig: { accessLevel: "user", subscriptionTier: "free" } 
          });
        }

        const { Pool } = await import("pg");
        const pool = new Pool({ connectionString: dbUrl });

        try {
          const existingUser = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
          );

          let userConfig: any = { accessLevel: "user", subscriptionTier: "free" };

          if (existingUser.rows.length > 0) {
            const user = existingUser.rows[0];
            userConfig = {
              accessLevel: user.access_level || "user",
              subscriptionTier: user.subscription_tier || "free",
              subscriptionStatus: user.subscription_status,
              displayName: user.display_name || displayName,
              photoURL: user.photo_url || photoURL,
              hallmarkId: user.hallmark_id,
              createdAt: user.created_at,
            };

            await pool.query(
              `UPDATE users SET 
                firebase_uid = $1, 
                display_name = COALESCE($2, display_name),
                photo_url = COALESCE($3, photo_url),
                last_login = NOW()
              WHERE email = $4`,
              [uid, displayName, photoURL, email]
            );
            logger?.info("[Firebase Auth] Updated existing user:", { email });
          } else {
            const hallmarkId = generateHallmarkId();
            
            await pool.query(
              `INSERT INTO users (email, firebase_uid, display_name, photo_url, access_level, subscription_tier, hallmark_id, created_at, last_login)
               VALUES ($1, $2, $3, $4, 'user', 'free', $5, NOW(), NOW())
               ON CONFLICT (email) DO UPDATE SET
                 firebase_uid = EXCLUDED.firebase_uid,
                 display_name = COALESCE(EXCLUDED.display_name, users.display_name),
                 photo_url = COALESCE(EXCLUDED.photo_url, users.photo_url),
                 last_login = NOW()`,
              [email, uid, displayName, photoURL, hallmarkId]
            );

            userConfig = {
              accessLevel: "user",
              subscriptionTier: "free",
              displayName,
              photoURL,
              hallmarkId,
            };
            logger?.info("[Firebase Auth] Created new user:", { email });
          }

          await pool.end();

          return c.json({ success: true, userConfig });
        } catch (dbError: any) {
          logger?.error("[Firebase Auth] Database error:", { error: dbError.message });
          await pool.end();
          return c.json({ 
            success: true, 
            userConfig: { accessLevel: "user", subscriptionTier: "free" } 
          });
        }
      } catch (error: any) {
        logger?.error("[Firebase Auth] Sync error:", { error: error.message });
        return c.json({ error: "Internal server error" }, 500);
      }
    },
  },
  {
    path: "/api/auth/verify",
    method: "POST" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const authHeader = c.req.header("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return c.json({ valid: false, error: "Missing token" }, 401);
        }

        const token = authHeader.replace("Bearer ", "");
        const decodedToken = await verifyFirebaseToken(token);

        if (!decodedToken) {
          return c.json({ valid: false, error: "Invalid token" }, 401);
        }

        logger?.info("[Firebase Auth] Token verified for:", { email: decodedToken.email });
        return c.json({
          valid: true,
          uid: decodedToken.uid,
          email: decodedToken.email,
        });
      } catch (error: any) {
        logger?.error("[Firebase Auth] Verify error:", { error: error.message });
        return c.json({ valid: false, error: "Verification failed" }, 500);
      }
    },
  },
];
