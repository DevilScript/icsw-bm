import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassCard from './GlassCard';
import { useToast } from '@/hooks/use-toast';

const AdminAuth = () => {
  const [adminKey, setAdminKey] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [keyGenerated, setKeyGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = setTimeout(() => {
      if (localStorage.getItem('adminAuthenticated') === 'true') {
        navigate('/admin', { replace: true });
      } else {
        toast({
          title: "ต้องยืนยันตัวตน",
          description: "โปรดคลิก 'ขอคีย์' เพื่อรับคีย์ยืนยันตัวตนผ่าน Discord",
          duration: 5000,
        });
      }
    }, 100);

    return () => clearTimeout(checkAuth);
  }, [navigate, toast]);

  const generateRandomKey = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => ('0' + byte.toString(16)).slice(-2)).join('');
  };

  const sendKeyToDiscord = async (key: string) => {
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      toast({
        title: "ข้อผิดพลาดการตั้งค่า",
        description: "ไม่มี URL สำหรับ Discord Webhook โปรดติดต่อฝ่ายสนับสนุน",
        variant: "destructive",
        duration: 7000,
      });
      localStorage.removeItem('auth_client_hash');
      localStorage.removeItem('auth_key_timestamp');
      localStorage.removeItem('adminAuthenticated');
      localStorage.removeItem('usedKeys');
      return false;
    }

    try {
      const securityInfo = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        clientHash: btoa(navigator.userAgent + window.screen.width + window.screen.height),
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `คีย์ยืนยันตัวตนใหม่: ${key}\nข้อมูลความปลอดภัย: ${JSON.stringify(securityInfo)}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send key to Discord');
      }

      localStorage.setItem('auth_client_hash', securityInfo.clientHash);
      localStorage.setItem('auth_key_timestamp', securityInfo.timestamp);
      return true;
    } catch {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถส่งคีย์ไปยัง Discord ได้ โปรดลองอีกครั้งหรือติดต่อฝ่ายสนับสนุน",
        variant: "destructive",
        duration: 7000,
      });
      localStorage.removeItem('auth_client_hash');
      localStorage.removeItem('auth_key_timestamp');
      localStorage.removeItem('adminAuthenticated');
      localStorage.removeItem('usedKeys');
      return false;
    }
  };

  const handleGetKey = async () => {
    setIsLoading(true);
    try {
      const newKey = generateRandomKey();
      setAdminKey(newKey);
      setKeyGenerated(true);
      const success = await sendKeyToDiscord(newKey);
      if (success) {
        toast({
          title: "สร้างคีย์ใหม่สำเร็จ",
          description: "คีย์ยืนยันตัวตนใหม่ถูกส่งไปยัง Discord แล้ว โปรดตรวจสอบและกรอกด้านล่าง",
          duration: 7000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const storedClientHash = localStorage.getItem('auth_client_hash');
    const currentHash = btoa(navigator.userAgent + window.screen.width + window.screen.height);
    const usedKeys = JSON.parse(localStorage.getItem('usedKeys') || '[]');

    if (storedClientHash && storedClientHash !== currentHash) {
      toast({
        title: "แจ้งเตือนความปลอดภัย",
        description: "การตรวจสอบอุปกรณ์ล้มเหลว โปรดขอคีย์ใหม่",
        variant: "destructive",
        duration: 7000,
      });
      localStorage.removeItem('auth_client_hash');
      localStorage.removeItem('auth_key_timestamp');
      localStorage.removeItem('adminAuthenticated');
      localStorage.removeItem('usedKeys');
      setKeyGenerated(false);
      setAdminKey('');
      setInputKey('');
      return;
    }

    if (usedKeys.includes(inputKey)) {
      toast({
        title: "การเข้าถึงถูกปฏิเสธ",
        description: "คีย์นี้ถูกใช้ไปแล้ว โปรดขอคีย์ใหม่",
        variant: "destructive",
        duration: 7000,
      });
      setInputKey('');
      return;
    }

    if (inputKey === adminKey && keyGenerated) {
      usedKeys.push(inputKey);
      localStorage.setItem('usedKeys', JSON.stringify(usedKeys));
      localStorage.setItem('adminAuthenticated', 'true');
      toast({
        title: "การเข้าถึงได้รับอนุญาต",
        description: "ยินดีต้อนรับสู่แดชบอร์ดแอดมิน!",
        duration: 5000,
      });
      setAdminKey('');
      setKeyGenerated(false);
      setInputKey('');
      navigate('/admin', { replace: true });
    } else {
      toast({
        title: "การเข้าถึงถูกปฏิเสธ",
        description: "คีย์ยืนยันตัวตนไม่ถูกต้อง โปรดลองอีกครั้งหรือขอคีย์ใหม่",
        variant: "destructive",
        duration: 7000,
      });
      setInputKey('');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8 bg-glass-dark">
      <GlassCard className="max-w-md w-full border border-pink-300/30 shadow-md">
        <div className="flex flex-col items-center mb-6">
          <div className="h-16 w-16 rounded-full bg-pink-300/20 backdrop-blur-sm flex items-center justify-center mb-4 border border-pink-300/30">
            <Key size={28} className="text-pink-300" />
          </div>
          <h2 className="text-2xl font-bold text-white">ยืนยันตัวตนแอดมิน</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="กรอกคีย์ยืนยันตัวตน"
            className="glass-input border-pink-300/30 focus:border-pink-400/50 text-center"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            required
            disabled={isLoading}
          />
          {!keyGenerated && (
            <p className="text-sm text-pink-300 text-center">
              โปรดคลิก "ขอคีย์" เพื่อรับคีย์ยืนยันตัวตนผ่าน Discord
            </p>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleGetKey}
              className="flex-1 bg-glass-dark/40 text-pink-300 hover:bg-glass-dark/60 border border-pink-300/30 transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? 'กำลังสร้าง...' : 'ขอคีย์'}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-pink-300/80 to-pink-400/80 hover:from-pink-300 hover:to-pink-400 text-white border border-pink-300/30 shadow-md transition-all duration-200"
              disabled={!keyGenerated || isLoading}
            >
              ยืนยันตัวตน
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

export default AdminAuth;