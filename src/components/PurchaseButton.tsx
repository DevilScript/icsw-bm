
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/UserAuthContext';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PurchaseButtonProps {
  itemId: string;
  itemName: string;
  price: number;
  onPurchaseComplete?: () => void;
}

const PurchaseButton = ({ itemId, itemName, price, onPurchaseComplete }: PurchaseButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { profile, refreshProfile } = useAuth();

  const handlePurchase = async () => {
    if (!profile) {
      toast({
        title: "Authentication required",
        description: "Please log in to make a purchase",
        variant: "destructive",
      });
      return;
    }

    if (profile.balance < price) {
      toast({
        title: "Insufficient balance",
        description: `You need ${price} THB to purchase this item. Please top up your balance.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Record the purchase
      const { error: purchaseError } = await supabase
        .from('balance_purchases')
        .insert({
          user_id: profile.id,
          item_name: itemName,
          amount: price
        });

      if (purchaseError) throw purchaseError;

      // Step 2: Update the user's balance
      const { error: balanceError } = await supabase
        .from('set_user')
        .update({
          balance: profile.balance - price,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (balanceError) throw balanceError;

      // Step 3: Refresh profile to update balance
      await refreshProfile();

      toast({
        title: "Purchase successful",
        description: `You've successfully purchased ${itemName}`,
      });

      // Notify parent component if needed
      if (onPurchaseComplete) {
        onPurchaseComplete();
      }
    } catch (error: any) {
      console.error('Error making purchase:', error);
      toast({
        title: "Purchase failed",
        description: error.message || "An error occurred during purchase",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePurchase}
      disabled={isLoading || !profile || profile.balance < price}
      className={`px-4 py-2 rounded-full transition-all ${
        profile && profile.balance >= price
          ? 'bg-pink-500 hover:bg-pink-600 hover:scale-105'
          : 'bg-gray-500 cursor-not-allowed'
      }`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
        </>
      ) : profile && profile.balance < price ? (
        'Insufficient Balance'
      ) : (
        `Purchase (${price} THB)`
      )}
    </Button>
  );
};

export default PurchaseButton;
