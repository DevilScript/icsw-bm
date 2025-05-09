
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for browser access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://tnwgtlyuabpmxsqiyjof.supabase.co";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const discordWebhook = Deno.env.get("DISCORD_WEBHOOK_URL") || "https://discord.com/api/webhooks/1368789991685095456/sr3yEJHbeHM6Tfz58OgjOclrlWo3nHN_pi_2fXqjHg-7ldR0wbo1JIptphWbzCeCQdDK";

const supabase = createClient(supabaseUrl, supabaseKey);

// Secret key for encryption/decryption
const SECRET_KEY = Deno.env.get("ADMIN_ENCRYPTION_KEY") || "ghoulre2025SecureKeyDoNotShare";

// Simple encryption function (replacing oak_crypto)
async function encrypt(text: string, secretKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const keyData = encoder.encode(secretKey);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    data
  );
  const signatureArray = Array.from(new Uint8Array(signature));
  const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Base64 encode the original text
  const base64 = btoa(text);
  
  // Return both for verification
  return base64 + '.' + signatureHex;
}

// Simple decryption function (replacing oak_crypto)
async function decrypt(encrypted: string, secretKey: string): Promise<string | null> {
  try {
    const parts = encrypted.split('.');
    if (parts.length !== 2) return null;
    
    const base64Text = parts[0];
    const providedSignature = parts[1];
    
    // Decode the base64 text
    const text = atob(base64Text);
    
    // Verify signature
    const computed = await encrypt(text, secretKey);
    const computedSignature = computed.split('.')[1];
    
    if (providedSignature !== computedSignature) {
      return null; // Signature verification failed
    }
    
    return text;
  } catch (e) {
    console.error("Decryption error:", e);
    return null;
  }
}

// Generate a random key
function generateRandomKey(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => ('0' + byte.toString(16)).slice(-2)).join('');
}

// Hash a string using SHA-256
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate a nonce
function generateNonce(): string {
  return crypto.randomUUID();
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();

    // 1. Generate Authentication Key
    if (action === "generateKey") {
      const { deviceFingerprint, ipAddress } = data;
      
      // Generate a new auth key
      const newKey = generateRandomKey();
      const keyHash = await hashString(newKey);
      const nonce = generateNonce();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry
      
      // Store in database
      const { error } = await supabase.from("admin_auth").insert([
        {
          auth_key: newKey,
          key_hash: keyHash,
          nonce,
          expires_at: expiresAt.toISOString(),
          device_fingerprint: deviceFingerprint,
          ip_address: ipAddress
        }
      ]);
      
      if (error) throw new Error(error.message);

      // Encrypt key for safe transmission
      const encryptedKey = await encrypt(newKey, SECRET_KEY);
      
      // Send to Discord webhook
      try {
        const securityMetadata = {
          timestamp: new Date().toISOString(),
          fingerprint: deviceFingerprint ? deviceFingerprint.substring(0, 20) + "..." : "Not provided",
          ip: ipAddress || "Unknown",
          nonce
        };
        
        await fetch(discordWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `New Admin Authentication Request\nKey: ${newKey}\n\nSecurity Data: ${JSON.stringify(securityMetadata)}\nTimestamp: ${new Date().toLocaleString()}`
          })
        });
      } catch (webhookError) {
        console.error("Discord webhook error:", webhookError);
        // Continue anyway - webhook failure shouldn't block the process
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: "Authentication key generated",
        data: { nonce, expires: expiresAt.toISOString() }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // 2. Verify Authentication Key
    else if (action === "verifyKey") {
      const { key, nonce, deviceFingerprint, ipAddress } = data;
      
      if (!key || !nonce || !deviceFingerprint) {
        return new Response(JSON.stringify({
          success: false,
          message: "Missing required authentication data"
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      // Find the auth record
      const { data: authData, error } = await supabase
        .from("admin_auth")
        .select("*")
        .eq("nonce", nonce)
        .eq("used", false)
        .single();
      
      if (error || !authData) {
        return new Response(JSON.stringify({
          success: false,
          message: "Invalid or expired authentication attempt"
        }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      // Check expiration
      if (new Date(authData.expires_at) < new Date()) {
        return new Response(JSON.stringify({
          success: false,
          message: "Authentication key expired"
        }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      // Verify key
      if (authData.auth_key !== key) {
        return new Response(JSON.stringify({
          success: false,
          message: "Invalid authentication key"
        }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      // Mark key as used
      await supabase
        .from("admin_auth")
        .update({ used: true })
        .eq("id", authData.id);
      
      // Generate session
      const sessionToken = crypto.randomUUID();
      const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // Store session
      const { error: sessionError } = await supabase
        .from("admin_sessions")
        .insert([{
          session_token: sessionToken,
          device_fingerprint: deviceFingerprint,
          expires_at: sessionExpiry.toISOString(),
          ip_address: ipAddress,
          user_agent: req.headers.get("user-agent") || ""
        }]);
      
      if (sessionError) {
        throw new Error(sessionError.message);
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: "Authentication successful",
        data: {
          sessionToken,
          expiresAt: sessionExpiry.toISOString()
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // 3. Validate Session
    else if (action === "validateSession") {
      const { sessionToken, deviceFingerprint } = data;
      
      if (!sessionToken || !deviceFingerprint) {
        return new Response(JSON.stringify({
          success: false,
          message: "Missing session data"
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      // Find the session
      const { data: sessionData, error } = await supabase
        .from("admin_sessions")
        .select("*")
        .eq("session_token", sessionToken)
        .single();
      
      if (error || !sessionData) {
        return new Response(JSON.stringify({
          success: false,
          message: "Invalid session"
        }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      // Check expiration
      if (new Date(sessionData.expires_at) < new Date()) {
        return new Response(JSON.stringify({
          success: false,
          message: "Session expired"
        }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      // Verify fingerprint
      if (sessionData.device_fingerprint !== deviceFingerprint) {
        return new Response(JSON.stringify({
          success: false,
          message: "Device verification failed"
        }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      // Update last active time
      await supabase
        .from("admin_sessions")
        .update({ last_active: new Date().toISOString() })
        .eq("id", sessionData.id);
      
      return new Response(JSON.stringify({
        success: true,
        message: "Session validated",
        data: {
          expiresAt: sessionData.expires_at
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // 4. Send 2FA Code
    else if (action === "send2FACode") {
      const { contactMethod, contactValue } = data;
      
      if (!contactMethod || !contactValue) {
        return new Response(JSON.stringify({
          success: false,
          message: "Missing contact information"
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      // Generate a 6-digit code
      const authCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      // Store in database
      const { error } = await supabase
        .from("two_factor_auth")
        .insert([{
          auth_code: authCode,
          contact_method: contactMethod,
          contact_value: contactValue,
          expires_at: expiresAt.toISOString()
        }]);
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Send code via Discord webhook for demo purposes
      // In production, this should be replaced with proper email or SMS sending
      try {
        await fetch(discordWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `2FA Code for ${contactMethod} (${contactValue}): ${authCode}\nExpires at: ${expiresAt.toLocaleString()}`
          })
        });
      } catch (webhookError) {
        console.error("Discord webhook error:", webhookError);
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: `2FA code sent to your ${contactMethod}`,
        data: {
          contactMethod,
          expiresAt: expiresAt.toISOString()
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // 5. Verify 2FA Code
    else if (action === "verify2FACode") {
      const { contactMethod, contactValue, authCode } = data;
      
      if (!contactMethod || !contactValue || !authCode) {
        return new Response(JSON.stringify({
          success: false,
          message: "Missing verification data"
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      // Find the 2FA record
      const { data: codeData, error } = await supabase
        .from("two_factor_auth")
        .select("*")
        .eq("auth_code", authCode)
        .eq("contact_method", contactMethod)
        .eq("contact_value", contactValue)
        .eq("verified", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (error || !codeData) {
        return new Response(JSON.stringify({
          success: false,
          message: "Invalid verification code"
        }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      // Check expiration
      if (new Date(codeData.expires_at) < new Date()) {
        return new Response(JSON.stringify({
          success: false,
          message: "Verification code expired"
        }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      // Mark as verified
      await supabase
        .from("two_factor_auth")
        .update({ verified: true })
        .eq("id", codeData.id);
      
      return new Response(JSON.stringify({
        success: true,
        message: "2FA verification successful"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // 6. Logout
    else if (action === "logout") {
      const { sessionToken } = data;
      
      if (!sessionToken) {
        return new Response(JSON.stringify({
          success: false,
          message: "Missing session token"
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      // Remove the session
      await supabase
        .from("admin_sessions")
        .delete()
        .eq("session_token", sessionToken);
      
      return new Response(JSON.stringify({
        success: true,
        message: "Logged out successfully"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    else {
      return new Response(JSON.stringify({
        success: false,
        message: "Invalid action"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    console.error("Admin auth function error:", error);
    
    return new Response(JSON.stringify({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV !== "production" ? error.message : "An unknown error occurred"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
