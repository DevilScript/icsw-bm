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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
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
    let intervalId: NodeJS.Timeout;

    const checkAuth = () => {
      try {
        const isAuth = sessionStorage.getItem('adminAuthenticated') === 'true';
        setIsAuthenticated(isAuth);
        if (isAuth) {
          clearInterval(intervalId);
        }
      } catch (error) {
        toast({
          title: "ข้อผิดพลาด",
          description: "ไม่สามารถตรวจสอบการยืนยันตัวตนได้ โปรดลองใหม่",
          variant: "destructive",
          duration: 7000,
        });
        setIsAuthenticated(false);
      }
    };

    const timeoutId = setTimeout(() => {
      checkAuth();
      intervalId = setInterval(checkAuth, 500);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [toast]);

  useEffect(() => {
    const loadSavedIds = () => {
      try {
        const storedData = localStorage.getItem('idData');
        if (storedData) {
          setSavedIds(JSON.parse(storedData));
        }
      } catch {
        toast({
          title: "ข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูล ID ได้",
          variant: "destructive",
          duration: 7000,
        });
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
        title: "ข้อผิดพลาด",
        description: "โปรดเลือกฝ่าย (CCG หรือ Ghoul)",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }
    
    if (rcFormData.faction === 'Ghoul' && !['Yoshimura', 'Kaneki'].includes(rcFormData.clan)) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ตระกูลไม่ถูกต้องสำหรับฝ่าย Ghoul โปรดเลือก Yoshimura หรือ Kaneki",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }
    
    try {
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
        title: "สำเร็จ",
        description: `เพิ่ม ID: ${rcFormData.id}`,
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
    } catch {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูล ID ได้",
        variant: "destructive",
        duration: 7000,
      });
    }
  };
  
  const handleWipeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (wipeFormData.faction === 'None') {
      toast({
        title: "ข้อผิดพลาด",
        description: "โปรดเลือกฝ่าย (CCG หรือ Ghoul)",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }
    
    if (!wipeFormData.count) {
      toast({
        title: "ข้อผิดพลาด",
        description: "โปรดกรอกจำนวน",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }
    
    if (wipeFormData.faction === 'Ghoul' && !['Yoshimura', 'Kaneki'].includes(wipeFormData.clan)) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ตระกูลไม่ถูกต้องสำหรับฝ่าย Ghoul โปรดเลือก Yoshimura หรือ Kaneki",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }
    
    try {
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
        title: "สำเร็จ",
        description: `อัปเดตจำนวน ${wipeFormData.clan} เป็น ${wipeFormData.count}`,
        duration: 5000,
      });
      
      setWipeFormData({ 
        clan: wipeFormData.clan, 
        faction: wipeFormData.faction, 
        count: '' 
      });
    } catch {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลตระกูลได้",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const handleIdSelect = (selectedId: string) => {
    try {
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
    } catch {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถเลือก ID เพื่อแก้ไขได้",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editFormData.faction === 'None') {
      toast({
        title: "ข้อผิดพลาด",
        description: "โปรดเลือกฝ่าย (CCG หรือ Ghoul)",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }
    
    if (editFormData.faction === 'Ghoul' && !['Yoshimura', 'Kaneki'].includes(editFormData.clan)) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ตระกูลไม่ถูกต้องสำหรับฝ่าย Ghoul โปรดเลือก Yoshimura หรือ Kaneki",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }
    
    try {
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
          title: "สำเร็จ",
          description: `อัปเดต ID: ${editFormData.id}`,
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
          title: "ข้อผิดพลาด",
          description: "ไม่พบ ID",
          variant: "destructive",
          duration: 7000,
        });
      }
    } catch {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตข้อมูล ID ได้",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const handleRemoveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const storedData = localStorage.getItem('idData');
      let idData = storedData ? JSON.parse(storedData) : [];
      
      const newIdData = idData.filter((item: IdData) => item.id !== removeId);
      
      if (newIdData.length < idData.length) {
        localStorage.setItem('idData', JSON.stringify(newIdData));
        
        toast({
          title: "สำเร็จ",
          description: `ลบ ID: ${removeId}`,
          duration: 5000,
        });
        
        setSavedIds(newIdData);
        
        setRemoveId('');
      } else {
        toast({
          title: "ข้อผิดพลาด",
          description: "ไม่พบ ID",
          variant: "destructive",
          duration: 7000,
        });
      }
    } catch {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถลบข้อมูล ID ได้",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('adminAuthenticated');
      sessionStorage.removeItem('auth_client_hash');
      sessionStorage.removeItem('auth_key_timestamp');
      sessionStorage.removeItem('usedKeys');
      setIsAuthenticated(false);
      navigate('/', { replace: true });
    } catch {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถออกจากระบบได้ โปรดลองใหม่",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  if (isAuthenticated === null) {
    return null;
  }

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
            <span className="text-pink-300">แอดมิน</span> แดชบอร์ด
          </h1>
          <p className="text-glass-light">เพิ่มและจัดการข้อมูล ID</p>
        </div>

        <div className="mb-6 text-right">
          <Button 
            onClick={handleLogout}
            className="bg-glass-dark/40 text-pink-300 hover:bg-glass-dark/60 hover:text-pink-300 border border-pink-300/30 shadow-md transition-all duration-200"
          >
            ออกจากระบบ
          </Button>
        </div>

        <Tabs defaultValue="add-id" className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList className="bg-glass-dark/40 backdrop-blur-sm border border-pink-300/20 shadow-md">
              <TabsTrigger value="add-id" className="data-[state=active]:bg-pink-300/80 data-[state=active]:text-white">
                เพิ่ม ID
              </TabsTrigger>
              <TabsTrigger value="add-clan" className="data-[state=active]:bg-pink-300/80 data-[state=active]:text-white">
                เพิ่มตระกูล ID
              </TabsTrigger>
              <TabsTrigger value="edit-id" className="data-[state=active]:bg-pink-300/80 data-[state=active]:text-white">
                แก้ไข ID
              </TabsTrigger>
              <TabsTrigger value="remove-id" className="data-[state=active]:bg-pink-300/80 data-[state=active]:text-white">
                ลบ ID
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
                      placeholder="กรอก ID" 
                      className="glass-input border-pink-300/30 focus:border-pink-300/50"
                      value={rcFormData.id}
                      onChange={(e) => setRcFormData({...rcFormData, id: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rc-faction">ฝ่าย</Label>
                      <Select 
                        value={rcFormData.faction}
                        onValueChange={(val) => handleFactionChange(val, 'add')}
                      >
                        <SelectTrigger className="glass-input border-pink-300/30">
                          <SelectValue placeholder="เลือกฝ่าย" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="None">ไม่มี</SelectItem>
                          <SelectItem value="CCG">CCG</SelectItem>
                          <SelectItem value="Ghoul">Ghoul</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="rc-clan">ตระกูล</Label>
                      <Select 
                        key={rcFormData.faction}
                        value={rcFormData.clan}
                        onValueChange={(val) => {
                          if (val && clans[rcFormData.faction]?.includes(val)) {
                            setRcFormData({...rcFormData, clan: val});
                          }
                        }}
                        disabled={rcFormData.faction === 'None'}
                      >
                        <SelectTrigger className="glass-input border-pink-300/30">
                          <SelectValue placeholder="เลือกตระกูล" />
                        </SelectTrigger>
                        <SelectContent>
                          {rcFormData.faction !== 'None' && clans[rcFormData.faction]?.map((clan) => (
                            <SelectItem key={clan} value={clan}>{clan}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rc-kagune">คากุเนะ</Label>
                      <Input 
                        id="rc-kagune" 
                        placeholder="กรอกคากุเนะ" 
                        className="glass-input border-pink-300/30 focus:border-pink-300/50"
                        value={rcFormData.kagune}
                        onChange={(e) => setRcFormData({...rcFormData, kagune: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="rc-rank">อันดับ</Label>
                      <Select 
                        value={rcFormData.rank}
                        onValueChange={(val) => setRcFormData({...rcFormData, rank: val})}
                      >
                        <SelectTrigger className="glass-input border-pink-300/30">
                          <SelectValue placeholder="เลือกอันดับ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SSS">SSS</SelectItem>
                          <SelectItem value="SS+">SS+</SelectItem>
                          <SelectItem value="SS">SS</SelectItem>
                          <SelectItem value="S+">S+</SelectItem>
                          <SelectItem value="S">S</SelectItem>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="kaguneV2" 
                      checked={rcFormData.isKaguneV2}
                      onCheckedChange={(checked) => 
                        setRcFormData({...rcFormData, isKaguneV2: checked as boolean})
                      }
                      className="border-pink-300/30 data-[state=checked]:bg-pink-300 data-[state=checked]:border-pink-300"
                    />
                    <Label 
                      htmlFor="kaguneV2"
                      className="text-sm text-glass-light cursor-pointer"
                    >
                      มีคากุเนะ V2
                    </Label>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rc-rc">ค่า RC</Label>
                      <Input 
                        id="rc-rc" 
                        type="number"
                        placeholder="ค่า RC" 
                        className="glass-input border-pink-300/30 focus:border-pink-300/50"
                        value={rcFormData.rc}
                        onChange={(e) => setRcFormData({...rcFormData, rc: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="rc-gp">ค่า GP</Label>
                      <Input 
                        id="rc-gp" 
                        type="number"
                        placeholder="ค่า GP" 
                        className="glass-input border-pink-300/30 focus:border-pink-300/50"
                        value={rcFormData.gp}
                        onChange={(e) => setRcFormData({...rcFormData, gp: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="rc-price">ราคา ($)</Label>
                      <Input 
                        id="rc-price" 
                        type="number"
                        placeholder="ราคา" 
                        className="glass-input border-pink-300/30 focus:border-pink-300/50"
                        value={rcFormData.price}
                        onChange={(e) => setRcFormData({...rcFormData, price: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="rc-link">ลิงก์ซื้อ</Label>
                    <Input 
                      id="rc-link" 
                      placeholder="กรอกลิงก์" 
                      className="glass-input border-pink-300/30 focus:border-pink-300/50"
                      value={rcFormData.link}
                      onChange={(e) => setRcFormData({...rcFormData, link: e.target.value})}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-pink-300/80 to-pink-400/80 hover:from-pink-300 hover:to-pink-400 text-white border border-pink-300/30 shadow-md transition-all duration-200"
                  >
                    เพิ่ม ID
                  </Button>
                </form>
              </GlassCard>
            </TabsContent>

            <TabsContent value="add-clan" className="mt-0">
              <GlassCard className="border border-pink-300/30 shadow-md">
                <form onSubmit={handleWipeSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="wipe-faction">ฝ่าย</Label>
                    <Select 
                      value={wipeFormData.faction}
                      onValueChange={(val) => handleFactionChange(val, 'wipe')}
                    >
                      <SelectTrigger className="glass-input border-pink-300/30">
                        <SelectValue placeholder="เลือกฝ่าย" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="None">ไม่มี</SelectItem>
                        <SelectItem value="CCG">CCG</SelectItem>
                        <SelectItem value="Ghoul">Ghoul</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="wipe-clan">ตระกูล</Label>
                    <Select 
                      key={wipeFormData.faction}
                      value={wipeFormData.clan}
                      onValueChange={(val) => {
                        if (val && clans[wipeFormData.faction]?.includes(val)) {
                          setWipeFormData({...wipeFormData, clan: val});
                        }
                      }}
                      disabled={wipeFormData.faction === 'None'}
                    >
                      <SelectTrigger className="glass-input border-pink-300/30">
                        <SelectValue placeholder="เลือกตระกูล" />
                      </SelectTrigger>
                      <SelectContent>
                        {wipeFormData.faction !== 'None' && clans[wipeFormData.faction]?.map((clan) => (
                          <SelectItem key={clan} value={clan}>{clan}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="wipe-count">จำนวน</Label>
                    <Input 
                      id="wipe-count" 
                      type="number"
                      placeholder="กรอกจำนวน" 
                      className="glass-input border-pink-300/30 focus:border-pink-300/50"
                      value={wipeFormData.count}
                      onChange={(e) => setWipeFormData({...wipeFormData, count: e.target.value})}
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-pink-300/80 to-pink-400/80 hover:from-pink-300 hover:to-pink-400 text-white border border-pink-300/30 shadow-md transition-all duration-200"
                  >
                    อัปเดตจำนวนตระกูล
                  </Button>
                </form>
              </GlassCard>
            </TabsContent>

            <TabsContent value="edit-id" className="mt-0">
              <GlassCard className="border border-pink-300/30 shadow-md">
                <form onSubmit={handleEditSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="edit-select-id">เลือก ID เพื่อแก้ไข</Label>
                    <Select 
                      value={editFormData.selectedId}
                      onValueChange={handleIdSelect}
                    >
                      <SelectTrigger className="glass-input border-pink-300/30">
                        <SelectValue placeholder="เลือก ID" />
                      </SelectTrigger>
                      <SelectContent>
                        {savedIds.map((id) => (
                          <SelectItem key={id.id} value={id.id}>
                            {id.id} - {id.clan}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {editFormData.selectedId && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="edit-id">ID</Label>
                        <Input 
                          id="edit-id" 
                          placeholder="กรอก ID" 
                          className="glass-input border-pink-300/30 focus:border-pink-300/50"
                          value={editFormData.id}
                          onChange={(e) => setEditFormData({...editFormData, id: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-faction">ฝ่าย</Label>
                          <Select 
                            value={editFormData.faction}
                            onValueChange={(val) => handleFactionChange(val, 'edit')}
                          >
                            <SelectTrigger className="glass-input border-pink-300/30">
                              <SelectValue placeholder="เลือกฝ่าย" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="None">ไม่มี</SelectItem>
                              <SelectItem value="CCG">CCG</SelectItem>
                              <SelectItem value="Ghoul">Ghoul</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="edit-clan">ตระกูล</Label>
                          <Select 
                            key={editFormData.faction}
                            value={editFormData.clan}
                            onValueChange={(val) => {
                              if (val && clans[editFormData.faction]?.includes(val)) {
                                setEditFormData({...editFormData, clan: val});
                              }
                            }}
                            disabled={editFormData.faction === 'None'}
                          >
                            <SelectTrigger className="glass-input border-pink-300/30">
                              <SelectValue placeholder="เลือกตระกูล" />
                            </SelectTrigger>
                            <SelectContent>
                              {editFormData.faction !== 'None' && clans[editFormData.faction]?.map((clan) => (
                                <SelectItem key={clan} value={clan}>{clan}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-kagune">คากุเนะ</Label>
                          <Input 
                            id="edit-kagune" 
                            placeholder="กรอกคากุเนะ" 
                            className="glass-input border-pink-300/30 focus:border-pink-300/50"
                            value={editFormData.kagune}
                            onChange={(e) => setEditFormData({...editFormData, kagune: e.target.value})}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="edit-rank">อันดับ</Label>
                          <Select 
                            value={editFormData.rank}
                            onValueChange={(val) => setEditFormData({...editFormData, rank: val})}
                          >
                            <SelectTrigger className="glass-input border-pink-300/30">
                              <SelectValue placeholder="เลือกอันดับ" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SSS">SSS</SelectItem>
                              <SelectItem value="SS+">SS+</SelectItem>
                              <SelectItem value="SS">SS</SelectItem>
                              <SelectItem value="S+">S+</SelectItem>
                              <SelectItem value="S">S</SelectItem>
                              <SelectItem value="A+">A+</SelectItem>
                              <SelectItem value="A">A</SelectItem>
                              <SelectItem value="B+">B+</SelectItem>
                              <SelectItem value="B">B</SelectItem>
                              <SelectItem value="C">C</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="edit-kaguneV2" 
                          checked={editFormData.isKaguneV2}
                          onCheckedChange={(checked) => 
                            setEditFormData({...editFormData, isKaguneV2: checked as boolean})
                          }
                          className="border-pink-300/30 data-[state=checked]:bg-pink-300 data-[state=checked]:border-pink-300"
                        />
                        <Label 
                          htmlFor="edit-kaguneV2"
                          className="text-sm text-glass-light cursor-pointer"
                        >
                          มีคากุเนะ V2
                        </Label>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-rc">ค่า RC</Label>
                          <Input 
                            id="edit-rc" 
                            type="number"
                            placeholder="ค่า RC" 
                            className="glass-input border-pink-300/30 focus:border-pink-300/50"
                            value={editFormData.rc}
                            onChange={(e) => setEditFormData({...editFormData, rc: e.target.value})}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="edit-gp">ค่า GP</Label>
                          <Input 
                            id="edit-gp" 
                            type="number"
                            placeholder="ค่า GP" 
                            className="glass-input border-pink-300/30 focus:border-pink-300/50"
                            value={editFormData.gp}
                            onChange={(e) => setEditFormData({...editFormData, gp: e.target.value})}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="edit-price">ราคา ($)</Label>
                          <Input 
                            id="edit-price" 
                            type="number"
                            placeholder="ราคา" 
                            className="glass-input border-pink-300/30 focus:border-pink-300/50"
                            value={editFormData.price}
                            onChange={(e) => setEditFormData({...editFormData, price: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="edit-link">ลิงก์ซื้อ</Label>
                        <Input 
                          id="edit-link" 
                          placeholder="กรอกลิงก์" 
                          className="glass-input border-pink-300/30 focus:border-pink-300/50"
                          value={editFormData.link}
                          onChange={(e) => setEditFormData({...editFormData, link: e.target.value})}
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-pink-300/80 to-pink-400/80 hover:from-pink-300 hover:to-pink-400 text-white border border-pink-300/30 shadow-md transition-all duration-200"
                      >
                        อัปเดต ID
                      </Button>
                    </>
                  )}
                </form>
              </GlassCard>
            </TabsContent>

            <TabsContent value="remove-id" className="mt-0">
              <GlassCard className="border border-pink-300/30 shadow-md">
                <form onSubmit={handleRemoveSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="remove-id">เลือก ID เพื่อลบ</Label>
                    <Select 
                      value={removeId}
                      onValueChange={setRemoveId}
                    >
                      <SelectTrigger className="glass-input border-pink-300/30">
                        <SelectValue placeholder="เลือก ID" />
                      </SelectTrigger>
                      <SelectContent>
                        {savedIds.map((id) => (
                          <SelectItem key={id.id} value={id.id}>
                            {id.id} - {id.clan}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-red-500/80 hover:bg-red-500 text-white border border-red-300/30 shadow-md transition-all duration-200"
                    disabled={!removeId}
                  >
                    ลบ ID ที่เลือก
                  </Button>
                </form>
              </GlassCard>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;