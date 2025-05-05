import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import GlassCard from '@/components/GlassCard';
import { useToast } from '@/hooks/use-toast';
import { Navigate, useNavigate } from 'react-router-dom';
import { IdData } from '@/components/IdDetails';

const Admin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [rcFormData, setRcFormData] = useState({
    id: '',
    clan: '',
    faction: 'None',
    kagune: '',
    isKaguneV2: false,
    rank: 'A',
    rc: '',
    gp: '',
    price: '',
    link: 'https://www.facebook.com/is.Moyx',
    isActive: true
  });
  
  const [wipeFormData, setWipeFormData] = useState({
    clan: '',
    faction: 'None',
    count: ''
  });

  const [editFormData, setEditFormData] = useState({
    selectedId: '',
    id: '',
    clan: '',
    faction: 'None',
    kagune: '',
    isKaguneV2: false,
    rank: '',
    rc: '',
    gp: '',
    price: '',
    link: '',
    isActive: true
  });

  const [removeId, setRemoveId] = useState('');
  const [savedIds, setSavedIds] = useState<IdData[]>([]);

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = sessionStorage.getItem('adminAuthenticated') === 'true';
      setIsAuthenticated(isAuth);
    };
    
    checkAuth();

    const loadSavedIds = () => {
      const storedData = localStorage.getItem('idData');
      if (storedData) {
        try {
          setSavedIds(JSON.parse(storedData));
        } catch {
          toast({
            title: "Error",
            description: "Failed to load ID data.",
            variant: "destructive",
            duration: 7000,
          });
        }
      }
    };

    if (isAuthenticated) {
      loadSavedIds();
    }
  }, [isAuthenticated, toast]);

  const handleFactionChange = (faction: string, formType: 'add' | 'edit' | 'wipe') => {
    let newClan = '';
    let newKagune = '';
    
    if (faction === 'CCG') {
      newClan = formType === 'add' && clans.CCG.includes(rcFormData.clan) ? rcFormData.clan :
                formType === 'edit' && clans.CCG.includes(editFormData.clan) ? editFormData.clan :
                formType === 'wipe' && clans.CCG.includes(wipeFormData.clan) ? wipeFormData.clan : 'Arima';
      newKagune = 'Quinque';
    } else if (faction === 'Ghoul') {
      newClan = formType === 'add' && clans.Ghoul.includes(rcFormData.clan) ? rcFormData.clan :
                formType === 'edit' && clans.Ghoul.includes(editFormData.clan) ? editFormData.clan :
                formType === 'wipe' && clans.Ghoul.includes(wipeFormData.clan) ? wipeFormData.clan : 'Yoshimura';
      newKagune = 'Ukaku';
    }
    
    if (formType === 'add') {
      setRcFormData({
        ...rcFormData,
        faction: faction,
        clan: newClan,
        kagune: newKagune
      });
    } else if (formType === 'edit') {
      setEditFormData({
        ...editFormData,
        faction: faction,
        clan: newClan,
        kagune: newKagune
      });
    } else if (formType === 'wipe') {
      setWipeFormData({
        ...wipeFormData,
        faction: faction,
        clan: newClan
      });
    }
  };

  const handleRcSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rcFormData.faction === 'None') {
      toast({
        title: "Error",
        description: "Please select a faction (CCG or Ghoul).",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }
    
    if (rcFormData.faction === 'Ghoul' && !['Yoshimura', 'Kaneki'].includes(rcFormData.clan)) {
      toast({
        title: "Error",
        description: "Invalid clan for Ghoul faction. Please select Yoshimura or Kaneki.",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }
    
    const storedData = localStorage.getItem('idData');
    const idData = storedData ? JSON.parse(storedData) : [];
    
    const newIdData = {
      ...rcFormData,
      rc: parseInt(rcFormData.rc) || 0,
      gp: parseInt(rcFormData.gp) || 0,
      price: parseInt(rcFormData.price) || 0
    };
    
    idData.push(newIdData);
    
    localStorage.setItem('idData', JSON.stringify(idData));
    
    toast({
      title: "Success",
      description: `Added ID: ${rcFormData.id}`,
      duration: 5000,
    });
    
    setRcFormData({ 
      id: '', 
      clan: rcFormData.clan, 
      faction: rcFormData.faction,
      kagune: rcFormData.kagune, 
      isKaguneV2: false, 
      rank: 'A', 
      rc: '', 
      gp: '', 
      price: '',
      link: 'https://www.facebook.com/is.Moyx',
      isActive: true
    });

    const updatedData = localStorage.getItem('idData');
    if (updatedData) {
      setSavedIds(JSON.parse(updatedData));
    }
  };
  
  const handleWipeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (wipeFormData.faction === 'None') {
      toast({
        title: "Error",
        description: "Please select a faction (CCG or Ghoul).",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }
    
    if (!wipeFormData.count) {
      toast({
        title: "Error",
        description: "Please enter a count value",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }
    
    if (wipeFormData.faction === 'Ghoul' && !['Yoshimura', 'Kaneki'].includes(wipeFormData.clan)) {
      toast({
        title: "Error",
        description: "Invalid clan for Ghoul faction. Please select Yoshimura or Kaneki.",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }
    
    const storedData = localStorage.getItem('wipeData');
    const wipeData = storedData ? JSON.parse(storedData) : [];
    
    const clanIndex = wipeData.findIndex((item: any) => 
      item.clan === wipeFormData.clan && item.faction === wipeFormData.faction
    );
    
    if (clanIndex >= 0) {
      wipeData[clanIndex].count = parseInt(wipeFormData.count);
    } else {
      wipeData.push({
        clan: wipeFormData.clan,
        faction: wipeFormData.faction,
        count: parseInt(wipeFormData.count)
      });
    }
    
    localStorage.setItem('wipeData', JSON.stringify(wipeData));
    
    toast({
      title: "Success",
      description: `Updated ${wipeFormData.clan} count to ${wipeFormData.count}`,
      duration: 5000,
    });
    
    setWipeFormData({ 
      clan: wipeFormData.clan, 
      faction: wipeFormData.faction, 
      count: '' 
    });
  };

  const handleIdSelect = (selectedId: string) => {
    const idToEdit = savedIds.find(id => id.id === selectedId);
    
    if (idToEdit) {
      setEditFormData({
        selectedId,
        id: idToEdit.id,
        clan: idToEdit.clan,
        faction: idToEdit.clan === 'Arima' || idToEdit.clan === 'Suzuya' ? 'CCG' : 'Ghoul',
        kagune: idToEdit.kagune,
        isKaguneV2: idToEdit.isKaguneV2,
        rank: idToEdit.rank,
        rc: idToEdit.rc.toString(),
        gp: idToEdit.gp.toString(),
        price: idToEdit.price.toString(),
        link: idToEdit.link || 'https://www.facebook.com/is.Moyx',
        isActive: idToEdit.isActive
      });
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editFormData.faction === 'None') {
      toast({
        title: "Error",
        description: "Please select a faction (CCG or Ghoul).",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }
    
    if (editFormData.faction === 'Ghoul' && !['Yoshimura', 'Kaneki'].includes(editFormData.clan)) {
      toast({
        title: "Error",
        description: "Invalid clan for Ghoul faction. Please select Yoshimura or Kaneki.",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }
    
    const storedData = localStorage.getItem('idData');
    let idData = storedData ? JSON.parse(storedData) : [];
    
    const idIndex = idData.findIndex((item: IdData) => item.id === editFormData.selectedId);
    
    if (idIndex >= 0) {
      idData[idIndex] = {
        ...idData[idIndex],
        id: editFormData.id,
        clan: editFormData.clan,
        kagune: editFormData.kagune,
        isKaguneV2: editFormData.isKaguneV2,
        rank: editFormData.rank,
        rc: parseInt(editFormData.rc) || 0,
        gp: parseInt(editFormData.gp) || 0,
        price: parseInt(editFormData.price) || 0,
        link: editFormData.link,
        isActive: editFormData.isActive
      };
      
      localStorage.setItem('idData', JSON.stringify(idData));
      
      toast({
        title: "Success",
        description: `Updated ID: ${editFormData.id}`,
        duration: 5000,
      });
      
      setSavedIds(idData);
      
      setEditFormData({
        selectedId: '',
        id: '',
        clan: editFormData.clan,
        faction: editFormData.faction,
        kagune: editFormData.kagune,
        isKaguneV2: false,
        rank: '',
        rc: '',
        gp: '',
        price: '',
        link: '',
        isActive: true
      });
    } else {
      toast({
        title: "Error",
        description: "ID not found",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const handleRemoveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const storedData = localStorage.getItem('idData');
    let idData = storedData ? JSON.parse(storedData) : [];
    
    const newIdData = idData.filter((item: IdData) => item.id !== removeId);
    
    if (newIdData.length < idData.length) {
      localStorage.setItem('idData', JSON.stringify(newIdData));
      
      toast({
        title: "Success",
        description: `Removed ID: ${removeId}`,
        duration: 5000,
      });
      
      setSavedIds(newIdData);
      
      setRemoveId('');
    } else {
      toast({
        title: "Error",
        description: "ID not found",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuthenticated');
    sessionStorage.removeItem('auth_client_hash');
    sessionStorage.removeItem('auth_key_timestamp');
    sessionStorage.removeItem('usedKeys');
    setIsAuthenticated(false);
    navigate('/');
  };

  if (!isAuthenticated) {
    return <Navigate to="/admin-auth" replace />;
  }

  const clans = {
    CCG: ['Arima', 'Suzuya'],
    Ghoul: ['Yoshimura', 'Kaneki']
  };
  
  const kagunes = {
    CCG: ['Quinque', 'Special Quinque'],
    Ghoul: ['Ukaku', 'Koukaku', 'Rinkaku', 'Bikaku']
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-glass-dark">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            <span className="text-pink-300">Admin</span> Dashboard
          </h1>
          <p className="text-glass-light">Add and manage ID data</p>
        </div>

        <div className="mb-6 text-right">
          <Button 
            onClick={handleLogout}
            className="bg-glass-dark/40 text-pink-300 hover:bg-glass-dark/60 hover:text-pink-300 border border-pink-300/30 shadow-md transition-all duration-200"
          >
            Logout
          </Button>
        </div>

        <Tabs defaultValue="add-id" className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList className="bg-glass-dark/40 backdrop-blur-sm border border-pink-300/20 shadow-md">
              <TabsTrigger value="add-id" className="data-[state=active]:bg-pink-300/80 data-[state=active]:text-white">
                Add ID
              </TabsTrigger>
              <TabsTrigger value="add-clan" className="data-[state=active]:bg-pink-300/80 data-[state=active]:text-white">
                Add Clan ID
              </TabsTrigger>
              <TabsTrigger value="edit-id" className="data-[state=active]:bg-pink-300/80 data-[state=active]:text-white">
                Edit ID
              </TabsTrigger>
              <TabsTrigger value="remove-id" className="data-[state=active]:bg-pink-300/80 data-[state=active]:text-white">
                Remove ID
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="mt-6">
            <TabsContent value="add-id" className="mt-0">
              <GlassCard className="border border-pink-300/30 shadow-md">
                <form onSubmit={handleRcSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="rc-id">ID</Label>
                    <Input 
                      id="rc-id" 
                      placeholder="Enter ID" 
                      className="glass-input border-pink-300/30 focus:border-pink-300/50"
                      value={rcFormData.id}
                      onChange={(e) => setRcFormData({...rcFormData, id: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rc-faction">Faction</Label>
                      <Select 
                        value={rcFormData.faction}
                        onValueChange={(val) => handleFactionChange(val, 'add')}
                      >
                        <SelectTrigger className="glass-input border-pink-300/30">
                          <SelectValue placeholder="Select Faction" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="None">None</SelectItem>
                          <SelectItem value="CCG">CCG</SelectItem>
                          <SelectItem value="Ghoul">Ghoul</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="rc-clan">Clan</Label>
                      <Select ขอบคุณที่ชี้แจง! จากคำขอของคุณ คุณยืนยันว่าต้องการใช้ `sessionStorage` (ไม่ใช่ `localStorage`) สำหรับการจัดการการยืนยันตัวตน (`adminAuthenticated`, `auth_client_hash`, `auth_key_timestamp`) เพื่อให้ข้อมูลถูกล้างเมื่อปิดแท็บหรือเบราว์เซอร์ ซึ่งเป็นตัวเลือกที่เหมาะสมสำหรับการยืนยันตัวตนชั่วคราวและปลอดภัยกว่าในกรณีนี้ คุณต้องการให้ฉัน:
1. แก้ไขโค้ด `AdminAuth.tsx` และ `Admin.tsx` เพื่อใช้ `sessionStorage` อย่างสม่ำเสมอ
2. ทำให้ฟังก์ชันใน `/admin-auth` ทำงานเรียบง่าย:
   - กด "Get Key" เพื่อส่ง key ไป Discord Webhook
   - กรอก key และ redirect ไป `/admin` ถ้าถูกต้อง
   - ป้องกันการใช้ key ซ้ำ
3. เมื่อกด logout จาก `/admin` จะล้างข้อมูลใน `sessionStorage` และ redirect ไปหน้าเริ่มต้น (`/`)
4. แก้ปัญหาการรวน ตรวจสอบให้ปลอดภัย และทำให้โค้ดลื่นไหลโดยไม่กระทบฟังก์ชันหลักใน `/admin` (เพิ่ม/แก้ไข/ลบ ID, อัปเดต clan count)
5. ลบ console logs และ debug messages เพื่อป้องกันการเห็นการทำงานภายใน

### การวิเคราะห์
จากโค้ดที่คุณให้มาและปัญหาการรวน:
- **สาเหตุที่รวน**:
  - การใช้ `sessionStorage` และ `localStorage` ผสมกันในโค้ดเดิมทำให้ `adminAuthenticated` ไม่สอดคล้องกัน
  - การจัดการ key ไม่มีการตรวจสอบการใช้ซ้ำ ทำให้อาจเกิดช่องโหว่
  - การโหลดหน้า `/admin-auth` หน่วงจาก animations หรือการเรียก toast โดยไม่จำเป็น
  - Console logs อาจเผยข้อมูล sensitive และทำให้โค้ดดูไม่สะอาด
- **แนวทางการแก้ไข**:
  - ใช้ `sessionStorage` อย่างสม่ำเสมอในทั้ง `AdminAuth.tsx` และ `Admin.tsx`
  - เพิ่มการตรวจสอบ key ที่ใช้แล้วด้วย array ใน `sessionStorage`
  - ลด animations และเพิ่ม loading state เพื่อ UX ที่ดีขึ้น
  - ลบ console logs และ debug messages
  - เพิ่มการจัดการข้อผิดพลาดและ validation เพื่อความเสถียร
  - รักษาฟังก์ชันหลักใน `/admin` โดยไม่เปลี่ยน logic การจัดการ ID และ clan count

### โค้ดที่อัปเดต
#### 1. `AdminAuth.tsx`
โค้ดนี้จัดการหน้า `/admin-auth` โดยมีฟังก์ชัน Get Key, ส่ง key ไป Discord, ตรวจสอบ key, และป้องกันการใช้ key ซ้ำ

<xaiArtifact artifact_id="ec030f41-5007-4659-8600-7c4062b21a73" artifact_version_id="dfb70da8-44e4-4204-bdc7-f184549e06d6" title="AdminAuth.tsx" contentType="text/typescript">
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
      if (sessionStorage.getItem('adminAuthenticated') === 'true') {
        navigate('/admin', { replace: true });
      } else {
        toast({
          title: "Authentication Required",
          description: "Please click 'Get Key' to receive an authentication key via Discord.",
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
        title: "Configuration Error",
        description: "Discord webhook URL is missing. Please contact support.",
        variant: "destructive",
        duration: 7000,
      });
      sessionStorage.removeItem('auth_client_hash');
      sessionStorage.removeItem('auth_key_timestamp');
      sessionStorage.removeItem('adminAuthenticated');
      sessionStorage.removeItem('usedKeys');
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
          content: `New Admin Authentication Key: ${key}\nSecurity Info: ${JSON.stringify(securityInfo)}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send key to Discord');
      }

      sessionStorage.setItem('auth_client_hash', securityInfo.clientHash);
      sessionStorage.setItem('auth_key_timestamp', securityInfo.timestamp);
      return true;
    } catch {
      toast({
        title: "Error",
        description: "Failed to send key to Discord. Please try again or contact support.",
        variant: "destructive",
        duration: 7000,
      });
      sessionStorage.removeItem('auth_client_hash');
      sessionStorage.removeItem('auth_key_timestamp');
      sessionStorage.removeItem('adminAuthenticated');
      sessionStorage.removeItem('usedKeys');
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
          title: "New Key Generated",
          description: "A new authentication key has been sent to Discord. Please check and enter it below.",
          duration: 7000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const storedClientHash = sessionStorage.getItem('auth_client_hash');
    const currentHash = btoa(navigator.userAgent + window.screen.width + window.screen.height);
    const usedKeys = JSON.parse(sessionStorage.getItem('usedKeys') || '[]');

    if (storedClientHash && storedClientHash !== currentHash) {
      toast({
        title: "Security Alert",
        description: "Client verification failed. Please get a new key.",
        variant: "destructive",
        duration: 7000,
      });
      sessionStorage.removeItem('auth_client_hash');
      sessionStorage.removeItem('auth_key_timestamp');
      sessionStorage.removeItem('adminAuthenticated');
      sessionStorage.removeItem('usedKeys');
      setKeyGenerated(false);
      setAdminKey('');
      setInputKey('');
      return;
    }

    if (usedKeys.includes(inputKey)) {
      toast({
        title: "Access Denied",
        description: "This key has already been used. Please get a new key.",
        variant: "destructive",
        duration: 7000,
      });
      setInputKey('');
      return;
    }

    if (inputKey === adminKey && keyGenerated) {
      usedKeys.push(inputKey);
      sessionStorage.setItem('usedKeys', JSON.stringify(usedKeys));
      sessionStorage.setItem('adminAuthenticated', 'true');
      toast({
        title: "Access Granted",
        description: "Welcome to the admin dashboard!",
        duration: 5000,
      });
      setAdminKey('');
      setKeyGenerated(false);
      setInputKey('');
      navigate('/admin', { replace: true });
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid authentication key. Please try again or get a new key.",
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
          <h2 className="text-2xl font-bold text-white">Admin Authentication</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Enter Authentication Key"
            className="glass-input border-pink-300/30 focus:border-pink-400/50 text-center"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            required
            disabled={isLoading}
          />
          {!keyGenerated && (
            <p className="text-sm text-pink-300 text-center">
              Please click "Get Key" to receive an authentication key via Discord.
            </p>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleGetKey}
              className="flex-1 bg-glass-dark/40 text-pink-300 hover:bg-glass-dark/60 border border-pink-300/30 transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? 'Generating...' : 'Get Key'}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-pink-300/80 to-pink-400/80 hover:from-pink-300 hover:to-pink-400 text-white border border-pink-300/30 shadow-md transition-all duration-200"
              disabled={!keyGenerated || isLoading}
            >
              Authenticate
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

export default AdminAuth;