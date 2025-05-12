
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface RedeemRequest {
  voucher_code: string;
  user_id: string;
}

interface RedeemResponse {
  status: string;
  message: string;
  amount?: number;
}

const VOUCHER_CODE_REGEX = /^[a-zA-Z0-9]{10,}$/;

async function redeemVoucher(voucherCode: string): Promise<RedeemResponse> {
  const phone = Deno.env.get('TRUEMONEY_PHONE') || '0653835988';

  if (!VOUCHER_CODE_REGEX.test(voucherCode)) {
    return {
      status: 'error',
      message: 'Invalid voucher code format',
    };
  }

  try {
    const response = await fetch(
      `https://gift.truemoney.com/campaign/vouchers/${voucherCode}/redeem`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'TrueMoneyRedeem/1.0',
          'Origin': 'https://gift.truemoney.com',
        },
        body: JSON.stringify({
          mobile: phone,
          voucher_hash: voucherCode,
        }),
      }
    );

    const data = await response.json();

    if (response.status === 200 && data.status?.code === 'SUCCESS') {
      const amount = parseFloat(data.data?.my_ticket?.amount_baht || '0');
      return {
        status: 'success',
        message: 'Voucher redeemed successfully',
        amount,
      };
    }
    return {
      status: 'error',
      message: data.status?.message || 'Failed to redeem voucher',
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Error redeeming voucher: ${error.message}`,
    };
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { voucher_code, user_id }: RedeemRequest = await req.json();
    if (!voucher_code || !user_id) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!VOUCHER_CODE_REGEX.test(voucher_code)) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Invalid voucher code format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || 'https://tnwgtlyuabpmxsqiyjof.supabase.co',
      Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRud2d0bHl1YWJwbXhzcWl5am9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NjE5NjgsImV4cCI6MjA2MjAzNzk2OH0.4YzXbSFRNp_qqPH_3pTltCJue7Mwsgh5GRHI0ZIjZ64'
    );

    // Verify JWT and get user data
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: authData, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !authData.user || authData.user.id !== user_id) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('set_user')
      .select('id, username, balance')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if voucher code was used before
    const { data: existingLog, error: logCheckError } = await supabase
      .from('balance_log')
      .select('voucher_code')
      .eq('voucher_code', voucher_code)
      .maybeSingle();

    if (logCheckError) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Failed to check voucher history' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingLog) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Voucher code already used' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Redeem voucher
    const result = await redeemVoucher(voucher_code);

    if (result.status !== 'success') {
      return new Response(
        JSON.stringify(result),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if amount is at least 10 THB
    const amount = result.amount || 0;
    if (amount < 10) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Voucher amount must be at least 10 THB' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use stored procedure to log and update balance
    const { error: transactionError } = await supabase.rpc('update_balance_and_log', {
      p_user_id: user_id,
      p_username: user.username,
      p_amount: amount,
      p_voucher_code: voucher_code,
    });

    if (transactionError) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Failed to update balance and log' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ status: 'error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
