
import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/UserAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

// Form schema for the voucher code
const formSchema = z.object({
  voucherCode: z.string().min(10, {
    message: "Voucher code must be at least 10 characters",
  }),
});

type FormValues = z.infer<typeof formSchema>;

const TopUpForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, refreshProfile } = useAuth();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      voucherCode: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to top up your balance",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || 'https://tnwgtlyuabpmxsqiyjof.supabase.co'}/functions/v1/redeem-voucher`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session?.access_token}`,
          },
          body: JSON.stringify({
            voucher_code: data.voucherCode,
            user_id: user.id,
          }),
        }
      );
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to redeem voucher');
      }
      
      toast({
        title: "Top up successful",
        description: `${result.amount} THB has been added to your balance`,
        variant: "default",
      });
      
      form.reset();
      
      // Refresh user profile to update balance
      await refreshProfile();
      
    } catch (error: any) {
      toast({
        title: "Top up failed",
        description: error.message || "An error occurred during top up",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-lg border border-pink-300/30 bg-glass-dark/60 backdrop-blur-md shadow-lg shadow-pink-500/10">
      <h2 className="text-xl font-semibold text-white mb-4">Top Up Your Balance</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="voucherCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">TrueMoney Voucher Code</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter your voucher code" 
                    {...field} 
                    className="bg-glass-dark/40 border-glass-light/20 text-white" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full bg-pink-500 hover:bg-pink-600" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
              </>
            ) : (
              "Redeem Voucher"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default TopUpForm;
