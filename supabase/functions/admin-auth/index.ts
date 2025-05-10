
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.177.0/encoding/base64.ts";

// Constants
const EXPIRY_TIME_MINUTES = 5;
const SESSION_EXPIRY_HOURS = 24;
const MAX_AUTH_ATTEMPTS = 3;
const DISCORD_WEBHOOK_URL = Deno.env.get("VITE_DISCORD_WEBHOOK_URL");

// CORS headers - Updated to include X-CSRF-TOKEN
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-csrf-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET, DELETE",
};

// Utility functions for encryption
async function generateEncryptionKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

async function encryptData(data: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const dataBytes = new TextEncoder().encode(data);
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    dataBytes
  );
  
  const result = new Uint8Array(iv.length + ciphertext.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(ciphertext), iv.length);
  
  return base64Encode(result);
}

async function generateAuthKey(): Promise<string> {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => ('0' + byte.toString(16)).slice(-2)).join('');
}

async function generateSecureToken(): Promise<string> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64Encode(array);
}

async function generateNonce(): Promise<string> {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64Encode(array);
}

async function sendWebhookNotification(key: string, securityInfo: any): Promise<boolean> {
  if (!DISCORD_WEBHOOK_URL) {
    console.error("Discord webhook URL not configured");
    return false;
  }

  try {
    const encryptionKey = await generateEncryptionKey();
    const encryptedKey = await encryptData(key, encryptionKey);
    
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: `New Admin Authentication Request\nKey: ${key}\n\n\nVerification Data: ${JSON.stringify(securityInfo)}\nTimestamp: ${new Date().toLocaleString()}`,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error sending webhook notification:", error);
    return false;
  }
}

async function storeAuthKey(supabase: any, key: string, deviceFingerprint: string, ipAddress: string, expiresAt: Date): Promise<string> {
  const nonce = await generateNonce();
  const keyHash = await hashString(key);
  
  const { error } = await supabase
    .from('admin_auth')
    .insert([{
      key_hash: keyHash,
      auth_key: key,
      device_fingerprint: deviceFingerprint,
      ip_address: ipAddress,
      nonce: nonce,
      expires_at: expiresAt.toISOString(),
    }]);
    
  if (error) {
    console.error("Database error:", error);
    throw new Error(`Failed to store auth key: ${error.message}`);
  }
  
  return nonce;
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function createAdminSession(supabase: any, deviceFingerprint: string, ipAddress: string, userAgent: string): Promise<string> {
  const sessionToken = await generateSecureToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + SESSION_EXPIRY_HOURS);
  
  const { error } = await supabase
    .from('admin_sessions')
    .insert([{
      device_fingerprint: deviceFingerprint,
      session_token: sessionToken,
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: expiresAt.toISOString(),
    }]);
    
  if (error) {
    throw new Error(`Failed to create admin session: ${error.message}`);
  }
  
  return sessionToken;
}

// Main handler
serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  
  // Create Supabase client
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Extract client IP and user agent
  const ipAddress = req.headers.get("x-forwarded-for") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";
  
  const url = new URL(req.url);
  const path = url.pathname.split("/").pop();
  
  try {
    console.log("Request path:", path);
    console.log("Request method:", req.method);
    
    // Request authentication key
    if (path === "request-key" && req.method === "POST") {
      console.log("Processing request-key endpoint");
      let reqBody;
      try {
        reqBody = await req.json();
      } catch (e) {
        console.error("Failed to parse request body:", e);
        throw new Error("Invalid request body");
      }
      
      const { deviceFingerprint } = reqBody;
      
      if (!deviceFingerprint) {
        throw new Error("Missing deviceFingerprint");
      }
      
      console.log("Device fingerprint:", deviceFingerprint);
      
      // Generate a secure key
      const key = await generateAuthKey();
      
      // Set expiry time
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + EXPIRY_TIME_MINUTES);
      
      // Store the key in the database
      const nonce = await storeAuthKey(supabase, key, deviceFingerprint, ipAddress, expiresAt);
      
      // Generate timestamp for security purposes
      const timestamp = new Date().toISOString();
      
      // Send notification via webhook
      const securityInfo = {
        timestamp,
        ipAddress,
        userAgent: userAgent.substring(0, 100),
        nonce,
        expiresAt: expiresAt.toISOString()
      };
      
      await sendWebhookNotification(key, securityInfo);
      
      return new Response(
        JSON.stringify({
          success: true,
          nonce,
          timestamp,
          expiresAt: expiresAt.toISOString()
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Verify authentication key
    if (path === "verify-key" && req.method === "POST") {
      console.log("Processing verify-key endpoint");
      let reqBody;
      try {
        reqBody = await req.json();
      } catch (e) {
        console.error("Failed to parse request body:", e);
        throw new Error("Invalid request body");
      }
      
      const { key, nonce, deviceFingerprint } = reqBody;
      
      if (!key || !nonce || !deviceFingerprint) {
        throw new Error("Missing required parameters");
      }
      
      console.log("Verifying key with nonce:", nonce);
      
      // Find the key in the database
      const { data, error } = await supabase
        .from('admin_auth')
        .select('*')
        .eq('auth_key', key)
        .eq('nonce', nonce)
        .eq('device_fingerprint', deviceFingerprint)
        .gt('expires_at', new Date().toISOString())
        .eq('used', false)
        .limit(1);
        
      if (error || !data || data.length === 0) {
        throw new Error("Invalid or expired key");
      }
      
      // Mark the key as used
      await supabase
        .from('admin_auth')
        .update({ used: true })
        .eq('id', data[0].id);
      
      // Create a session
      const sessionToken = await createAdminSession(supabase, deviceFingerprint, ipAddress, userAgent);
      
      return new Response(
        JSON.stringify({
          success: true,
          sessionToken,
          expiresIn: SESSION_EXPIRY_HOURS * 60 * 60 // in seconds
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Verify session
    if (path === "verify-session" && req.method === "POST") {
      const { sessionToken, deviceFingerprint } = await req.json();
      
      if (!sessionToken || !deviceFingerprint) {
        throw new Error("Missing required parameters");
      }
      
      // Find the session in the database
      const { data, error } = await supabase
        .from('admin_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .eq('device_fingerprint', deviceFingerprint)
        .gt('expires_at', new Date().toISOString())
        .limit(1);
        
      if (error || !data || data.length === 0) {
        throw new Error("Invalid or expired session");
      }
      
      // Update last active timestamp
      await supabase
        .from('admin_sessions')
        .update({ last_active: new Date().toISOString() })
        .eq('id', data[0].id);
      
      return new Response(
        JSON.stringify({
          success: true,
          valid: true
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Logout
    if (path === "logout" && req.method === "POST") {
      const { sessionToken, deviceFingerprint } = await req.json();
      
      if (!sessionToken || !deviceFingerprint) {
        throw new Error("Missing required parameters");
      }
      
      // Delete the session
      const { error } = await supabase
        .from('admin_sessions')
        .delete()
        .eq('session_token', sessionToken)
        .eq('device_fingerprint', deviceFingerprint);
        
      if (error) {
        console.error("Error deleting session:", error);
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Logged out successfully"
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Handle unknown paths
    return new Response(
      JSON.stringify({ error: "Not found" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An error occurred"
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
