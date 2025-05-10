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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// RC Data type
interface RcData {
  id: string;
  rc: string;
  price: number;
  created_at: string | null;
  updated_at: string | null;
}

// Clan Data type
interface ClanData {
  clan: string;
  faction: string;
  count: number;
}

const Admin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, logout } = useAuth();

  // RC form state
  const [rcFormData, setRcFormData] = useState({
    game_id: '',
    clan: '',
    faction: 'None',
    kagune: '',
    is_kagune_v2: false,
    is_sold_out: false,
    rank: 'A',
    rc: '',
    gp: '',
    price: '',
    link: 'https://www.facebook.com/is.Moyx',
    is_active: true
  });

  // Separate state for faction in add tab
  const [factionAdd, setFactionAdd] = useState('None');

  // RC Management states
  const [rcManageData, setRcManageData] = useState({
    rc: '',
    price: '',
  });

  const [editRcData, setEditRcData] = useState({
    selectedId: '',
    rc: '',
    price: '',
  });

  const [removeRcId, setRemoveRcId] = useState('');
  const [savedRcItems, setSavedRcItems] = useState<RcData[]>([]);

  // Other existing states
  const [wipeFormData, setWipeFormData] = useState({
    clan: '',
    faction: 'None',
    count: '',
    currentCount: 0
  });

  const [editFormData, setEditFormData] = useState({
    selectedId: '',
    game_id: '',
    clan: '',
    faction: 'None',
    kagune: '',
    is_kagune_v2: false,
    is_sold_out: false,
    rank: '',
    rc: '',
    gp: '',
    price: '',
    link: '',
    is_active: true
  });

  const [removeId, setRemoveId] = useState('');
  const [savedIds, setSavedIds] = useState<IdData[]>([]);
  const [savedClans, setSavedClans] = useState<ClanData[]>([]);

  // CCG Ranks
  const ccgRanks = [
    'Special Class Investigator',
    'Associate Special Investigator',
    'First Class Investigator',
    'Associate First Class',
    'Semi-Associate First Class',
    'Second Class Investigator',
    'Rank 1 Investigator',
    'Rank 2 Investigator',
    'Rank 3 Investigator'
  ];

  // Ghoul Ranks
  const ghoulRanks = [
    'SSS',
    'SS+',
    'SS',
    'S+',
    'S',
    'A+',
    'A',
    'B+',
    'B',
    'C'
  ];

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load IDs
        const { data: idData, error: idError } = await supabase
          .from('set_id')
          .select('*');
        if (idError) throw idError;
        setSavedIds(idData || []);

        // Load RC data
        const { data: rcData, error: rcError } = await supabase
          .from('set_rc')
          .select('*');
        if (rcError) throw rcError;
        setSavedRcItems(rcData || []);

        // Load clan data
        const { data: clanData, error: clanError } = await supabase
          .from('set_clan')
          .select('*');
        if (clanError) throw clanError;
        setSavedClans(clanData || []);
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast({
          title: "ข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูลได้",
          variant: "destructive",
          duration: 7000,
        });
      }
    };

    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, toast]);

  // Setup realtime subscription for RC and clan data changes
  useEffect(() => {
    if (!isAuthenticated) return;

    const rcChannel = supabase
      .channel('set_rc_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'set_rc' },
        async () => {
          console.log('RC data changed, reloading...');
          const { data, error } = await supabase
            .from('set_rc')
            .select('*');
          if (error) {
            console.error('Error loading RC data:', error);
            return;
          }
          setSavedRcItems(data || []);
        }
      )
      .subscribe();

    const clanChannel = supabase
      .channel('set_clan_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'set_clan' },
        async () => {
          console.log('Clan data changed, reloading...');
          const { data, error } = await supabase
            .from('set_clan')
            .select('*');
          if (error) {
            console.error('Error loading clan data:', error);
            return;
          }
          setSavedClans(data || []);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(rcChannel);
      supabase.removeChannel(clanChannel);
    };
  }, [isAuthenticated]);

  const handleFactionChange = (faction: string, formType: 'add' | 'edit' | 'wipe') => {
    console.log(`handleFactionChange called: faction=${faction}, formType=${formType}`);
    let newClan = '';
    let newKagune = '';
    
    if (faction === 'CCG') {
      newClan = formType === 'add' ? 'Arima' :
                formType === 'edit' && clans.CCG.includes(editFormData.clan) ? editFormData.clan :
                formType === 'wipe' && clans.CCG.includes(wipeFormData.clan) ? wipeFormData.clan : 'Arima';
      newKagune = '';
    } else if (faction === 'Ghoul') {
      newClan = formType === 'add' ? 'Yoshimura' :
                formType === 'edit' && clans.Ghoul.includes(editFormData.clan) ? editFormData.clan :
                formType === 'wipe' && clans.Ghoul.includes(wipeFormData.clan) ? wipeFormData.clan : 'Yoshimura';
      newKagune = '';
    } else {
      newClan = '';
      newKagune = '';
    }
    
    console.log(`New values: clan=${newClan}, kagune=${newKagune}, rank=${faction === 'CCG' ? ccgRanks[0] : ghoulRanks[0]}`);

    if (formType === 'add') {
      setFactionAdd(faction);
      setRcFormData({
        game_id: '',
        clan: newClan,
        faction,
        kagune: newKagune,
        is_kagune_v2: false,
        is_sold_out: false,
        rank: faction === 'CCG' ? ccgRanks[0] : ghoulRanks[0],
        rc: '',
        gp: '',
        price: '',
        link: 'https://www.facebook.com/is.Moyx',
        is_active: true
      });
      console.log('Updated rcFormData:', { faction, clan: newClan, kagune: newKagune, rank: faction === 'CCG' ? ccgRanks[0] : ghoulRanks[0] });
    } else if (formType === 'edit') {
      setEditFormData(prev => ({
        ...prev,
        faction,
        clan: newClan,
        kagune: newKagune,
        rank: faction === 'CCG' ? ccgRanks[0] : prev.rank || ghoulRanks[0]
      }));
      console.log('Updated editFormData:', { faction, clan: newClan, kagune: newKagune, rank: faction === 'CCG' ? ccgRanks[0] : editFormData.rank || ghoulRanks[0] });
    } else if (formType === 'wipe') {
      const currentClan = savedClans.find(c => c.clan === newClan && c.faction === faction);
      setWipeFormData(prev => ({
        ...prev,
        faction,
        clan: newClan,
        currentCount: currentClan ? currentClan.count : 0
      }));
      console.log('Updated wipeFormData:', { faction, clan: newClan, currentCount: currentClan ? currentClan.count : 0 });
    }
  };

  const handleClanChange = (clan: string, formType: 'add' | 'edit' | 'wipe') => {
    console.log(`handleClanChange called: clan=${clan}, formType=${formType}`);
    if (formType === 'add') {
      setRcFormData(prev => {
        const newState = { ...prev, clan };
        console.log('Updated rcFormData clan:', newState);
        return newState;
      });
    } else if (formType === 'edit') {
      setEditFormData(prev => {
        const newState = { ...prev, clan };
        console.log('Updated editFormData clan:', newState);
        return newState;
      });
    } else if (formType === 'wipe') {
      const currentClan = savedClans.find(c => c.clan === clan && c.faction === wipeFormData.faction);
      setWipeFormData(prev => {
        const newState = {
          ...prev,
          clan,
          currentCount: currentClan ? currentClan.count : 0
        };
        console.log('Updated wipeFormData clan:', newState);
        return newState;
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      console.log('Enter key pressed, preventing form submission');
      e.preventDefault();
    }
  };

  const handleRcSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleRcSubmit called');

    if (rcFormData.faction === 'None') {
      console.error('Validation failed: faction is None');
      toast({
        title: "ข้อผิดพลาด",
        description: "โปรดเลือกฝ่าย (CCG หรือ Ghoul)",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }

    if (rcFormData.faction === 'Ghoul' && !['Yoshimura', 'Kaneki'].includes(rcFormData.clan)) {
      console.error('Validation failed: invalid clan for Ghoul:', rcFormData.clan);
      toast({
        title: "ข้อผิดพลาด",
        description: "ตระกูลไม่ถูกต้องสำหรับฝ่าย Ghoul โปรดเลือก Yoshimura หรือ Kaneki",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }

    try {
      const newIdData = {
        game_id: rcFormData.is_sold_out ? '❌ Sold Out ❌' : rcFormData.game_id,
        clan: rcFormData.clan,
        kagune: rcFormData.kagune,
        is_kagune_v2: rcFormData.is_kagune_v2,
        is_sold_out: rcFormData.is_sold_out,
        rank: rcFormData.rank,
        rc: parseInt(rcFormData.rc) || 0,
        gp: parseInt(rcFormData.gp) || 0,
        price: parseInt(rcFormData.price) || 0,
        link: rcFormData.link,
        is_active: rcFormData.is_active
      };

      console.log('Submitting new ID:', newIdData);

      const { error } = await supabase
        .from('set_id')
        .insert([newIdData]);

      if (error) throw error;

      toast({
        title: "สำเร็จ",
        description: `เพิ่ม ID: ${newIdData.game_id}`,
        duration: 5000,
      });

      setFactionAdd('None');
      setRcFormData({
        game_id: '',
        clan: '',
        faction: 'None',
        kagune: '',
        is_kagune_v2: false,
        is_sold_out: false,
        rank: 'A',
        rc: '',
        gp: '',
        price: '',
        link: 'https://www.facebook.com/is.Moyx',
        is_active: true
      });

      console.log('Reset rcFormData after submit:', rcFormData);

      const { data } = await supabase
        .from('set_id')
        .select('*');
      if (data) setSavedIds(data);
    } catch (error) {
      console.error('Error inserting ID data:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูล ID ได้",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const handleWipeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleWipeSubmit called');

    if (wipeFormData.faction === 'None') {
      console.error('Validation failed: faction is None for wipe');
      toast({
        title: "ข้อผิดพลาด",
        description: "โปรดเลือกฝ่าย (CCG หรือ Ghoul)",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }

    if (!wipeFormData.count) {
      console.error('Validation failed: count is empty for wipe');
      toast({
        title: "ข้อผิดพลาด",
        description: "โปรดกรอกจำนวน",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }

    if (wipeFormData.faction === 'Ghoul' && !['Yoshimura', 'Kaneki'].includes(wipeFormData.clan)) {
      console.error('Validation failed: invalid clan for Ghoul wipe:', wipeFormData.clan);
      toast({
        title: "ข้อผิดพลาด",
        description: "ตระกูลไม่ถูกต้องสำหรับฝ่าย Ghoul โปรดเลือก Yoshimura หรือ Kaneki",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }

    try {
      const { data: existingClans, error: checkError } = await supabase
        .from('set_clan')
        .select('*')
        .eq('clan', wipeFormData.clan)
        .eq('faction', wipeFormData.faction);

      if (checkError) throw checkError;

      console.log('Checking existing clans:', existingClans);

      if (existingClans && existingClans.length > 0) {
        const { error: updateError } = await supabase
          .from('set_clan')
          .update({ count: parseInt(wipeFormData.count) })
          .eq('clan', wipeFormData.clan)
          .eq('faction', wipeFormData.faction);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('set_clan')
          .insert([{
            clan: wipeFormData.clan,
            faction: wipeFormData.faction,
            count: parseInt(wipeFormData.count)
          }]);

        if (insertError) throw insertError;
      }

      toast({
        title: "สำเร็จ",
        description: `อัปเดตจำนวน ${wipeFormData.clan} เป็น ${wipeFormData.count}`,
        duration: 5000,
      });

      setWipeFormData({
        clan: wipeFormData.clan,
        faction: wipeFormData.faction,
        count: '',
        currentCount: parseInt(wipeFormData.count)
      });

      console.log('Reset wipeFormData after submit:', wipeFormData);

      const { data } = await supabase
        .from('set_clan')
        .select('*');
      if (data) setSavedClans(data);
    } catch (error) {
      console.error('Error updating clan data:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลตระกูลได้",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const handleIdSelect = async (selectedId: string) => {
    try {
      console.log('Selecting ID:', selectedId);
      const idToEdit = savedIds.find(id => id.id === selectedId);

      if (idToEdit) {
        setEditFormData({
          selectedId,
          game_id: idToEdit.game_id,
          clan: idToEdit.clan,
          faction: idToEdit.clan === 'Arima' || idToEdit.clan === 'Suzuya' ? 'CCG' : 'Ghoul',
          kagune: idToEdit.kagune,
          is_kagune_v2: idToEdit.is_kagune_v2,
          is_sold_out: idToEdit.is_sold_out || false,
          rank: idToEdit.rank,
          rc: idToEdit.rc.toString(),
          gp: idToEdit.gp.toString(),
          price: idToEdit.price.toString(),
          link: idToEdit.link || 'https://www.facebook.com/is.Moyx',
          is_active: idToEdit.is_active
        });
        console.log('Selected ID data:', idToEdit);
      }
    } catch (error) {
      console.error('Error selecting ID:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถเลือก ID เพื่อแก้ไขได้",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleEditSubmit called');

    if (editFormData.faction === 'None') {
      console.error('Validation failed: faction is None for edit');
      toast({
        title: "ข้อผิดพลาด",
        description: "โปรดเลือกฝ่าย (CCG หรือ Ghoul)",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }

    if (editFormData.faction === 'Ghoul' && !['Yoshimura', 'Kaneki'].includes(editFormData.clan)) {
      console.error('Validation failed: invalid clan for Ghoul edit:', editFormData.clan);
      toast({
        title: "ข้อผิดพลาด",
        description: "ตระกูลไม่ถูกต้องสำหรับฝ่าย Ghoul โปรดเลือก Yoshimura หรือ Kaneki",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }

    try {
      const updatedId = {
        game_id: editFormData.is_sold_out ? '❌ Sold Out ❌' : editFormData.game_id,
        clan: editFormData.clan,
        kagune: editFormData.kagune,
        is_kagune_v2: editFormData.is_kagune_v2,
        is_sold_out: editFormData.is_sold_out,
        rank: editFormData.rank,
        rc: parseInt(editFormData.rc) || 0,
        gp: parseInt(editFormData.gp) || 0,
        price: parseInt(editFormData.price) || 0,
        link: editFormData.link,
        is_active: editFormData.is_active
      };

      console.log('Submitting updated ID:', updatedId);

      const { error } = await supabase
        .from('set_id')
        .update(updatedId)
        .eq('id', editFormData.selectedId);

      if (error) throw error;

      toast({
        title: "สำเร็จ",
        description: `อัปเดต ID: ${updatedId.game_id}`,
        duration: 5000,
      });

      const { data } = await supabase
        .from('set_id')
        .select('*');
      if (data) setSavedIds(data);

      setEditFormData({
        selectedId: '',
        game_id: '',
        clan: '',
        faction: 'None',
        kagune: '',
        is_kagune_v2: false,
        is_sold_out: false,
        rank: '',
        rc: '',
        gp: '',
        price: '',
        link: '',
        is_active: true
      });

      console.log('Reset editFormData after submit:', editFormData);
    } catch (error) {
      console.error('Error updating ID:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตข้อมูล ID ได้",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const handleRemoveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleRemoveSubmit called');

    try {
      console.log('Removing ID:', removeId);
      const { error } = await supabase
        .from('set_id')
        .delete()
        .eq('id', removeId);

      if (error) throw error;

      toast({
        title: "สำเร็จ",
        description: `ลบ ID เสร็จสิ้น`,
        duration: 5000,
      });

      const { data } = await supabase
        .from('set_id')
        .select('*');
      if (data) setSavedIds(data);

      setRemoveId('');
      console.log('Reset removeId after delete');
    } catch (error) {
      console.error('Error removing ID:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถลบข้อมูล ID ได้",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const handleRcManageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleRcManageSubmit called');

    if (!rcManageData.rc || !rcManageData.price) {
      console.error('Validation failed: rc or price is empty for RC manage');
      toast({
        title: "ข้อผิดพลาด",
        description: "โปรดกรอกค่า RC และราคาให้ครบถ้วน",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }

    try {
      const newRcData = {
        rc: rcManageData.rc,
        price: parseInt(rcManageData.price) || 0
      };

      console.log('Submitting new RC:', newRcData);

      const { error } = await supabase
        .from('set_rc')
        .insert([newRcData]);

      if (error) throw error;

      toast({
        title: "สำเร็จ",
        description: `เพิ่ม RC: ${rcManageData.rc}`,
        duration: 5000,
      });

      setRcManageData({
        rc: '',
        price: '',
      });

      console.log('Reset rcManageData after submit');

      const { data } = await supabase
        .from('set_rc')
        .select('*');
      if (data) setSavedRcItems(data);
    } catch (error) {
      console.error('Error inserting RC data:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูล RC ได้",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const handleEditRcSelect = async (selectedId: string) => {
    try {
      console.log('Selecting RC:', selectedId);
      const rcToEdit = savedRcItems.find(item => item.id === selectedId);

      if (rcToEdit) {
        setEditRcData({
          selectedId,
          rc: rcToEdit.rc,
          price: rcToEdit.price.toString(),
        });
        console.log('Selected RC data:', rcToEdit);
      }
    } catch (error) {
      console.error('Error selecting RC:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถเลือก RC เพื่อแก้ไขได้",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const handleEditRcSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleEditRcSubmit called');

    if (!editRcData.rc || !editRcData.price) {
      console.error('Validation failed: rc or price is empty for RC edit');
      toast({
        title: "ข้อผิดพลาด",
        description: "โปรดกรอกค่า RC และราคาให้ครบถ้วน",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }

    try {
      const updatedRc = {
        rc: editRcData.rc,
        price: parseInt(editRcData.price) || 0,
      };

      console.log('Submitting updated RC:', updatedRc);

      const { error } = await supabase
        .from('set_rc')
        .update(updatedRc)
        .eq('id', editRcData.selectedId);

      if (error) throw error;

      toast({
        title: "สำเร็จ",
        description: `อัปเดต RC: ${editRcData.rc}`,
        duration: 5000,
      });

      const { data } = await supabase
        .from('set_rc')
        .select('*');
      if (data) setSavedRcItems(data);

      setEditRcData({
        selectedId: '',
        rc: '',
        price: '',
      });

      console.log('Reset editRcData after submit');
    } catch (error) {
      console.error('Error updating RC:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตข้อมูล RC ได้",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const handleRemoveRcSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleRemoveRcSubmit called');

    try {
      console.log('Removing RC:', removeRcId);
      const { error } = await supabase
        .from('set_rc')
        .delete()
        .eq('id', removeRcId);

      if (error) throw error;

      toast({
        title: "สำเร็จ",
        description: `ลบ RC เสร็จสิ้น`,
        duration: 5000,
      });

      const { data } = await supabase
        .from('set_rc')
        .select('*');
      if (data) setSavedRcItems(data);

      setRemoveRcId('');
      console.log('Reset removeRcId after delete');
    } catch (error) {
      console.error('Error removing RC:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถลบข้อมูล RC ได้",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const handleLogout = () => {
    console.log('Logging out user');
    logout();
    navigate('/', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-pink-300 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('User not authenticated, redirecting to /admin-auth');
    return <Navigate to="/admin-auth" replace />;
  }

  const clans = {
    CCG: ['Arima', 'Suzuya'],
    Ghoul: ['Yoshimura', 'Kaneki']
  };

  console.log('Rendering with rcFormData.faction:', rcFormData.faction);
  console.log('Rendering with factionAdd:', factionAdd);
  console.log('Rendering with editFormData.faction:', editFormData.faction);

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
              <TabsTrigger value="manage-rc" className="data-[state=active]:bg-pink-300/80 data-[state=active]:text-white">
                จัดการ RC
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
                      value={rcFormData.is_sold_out ? '❌ Sold Out ❌' : rcFormData.game_id}
                      onChange={(e) => !rcFormData.is_sold_out && setRcFormData({...rcFormData, game_id: e.target.value})}
                      onKeyDown={handleKeyDown}
                      disabled={rcFormData.is_sold_out}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rc-faction">ฝ่าย</Label>
                      <Select
                        value={factionAdd}
                        onValueChange={(val) => {
                          console.log('Faction selected for add:', val);
                          handleFactionChange(val, 'add');
                        }}
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
                        onValueChange={(val) => handleClanChange(val, 'add')}
                        disabled={rcFormData.faction === 'None'}
                      >
                        <SelectTrigger className="glass-input border-pink-300/30">
                          <SelectValue placeholder="เลือกตระกูล" />
                        </SelectTrigger>
                        <SelectContent>
                          {rcFormData.faction !== 'None' && clans[rcFormData.faction as keyof typeof clans]?.map((clan) => (
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
                        onKeyDown={handleKeyDown}
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
                          {rcFormData.faction === 'CCG' ? (
                            ccgRanks.map((rank) => (
                              <SelectItem key={rank} value={rank}>{rank}</SelectItem>
                            ))
                          ) : (
                            ghoulRanks.map((rank) => (
                              <SelectItem key={rank} value={rank}>{rank}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="kaguneV2"
                        checked={rcFormData.is_kagune_v2}
                        onCheckedChange={(checked) =>
                          setRcFormData({...rcFormData, is_kagune_v2: checked as boolean})
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
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="soldOut"
                        checked={rcFormData.is_sold_out}
                        onCheckedChange={(checked) =>
                          setRcFormData({...rcFormData, is_sold_out: checked as boolean})
                        }
                        className="border-pink-300/30 data-[state=checked]:bg-pink-300 data-[state=checked]:border-pink-300"
                      />
                      <Label
                        htmlFor="soldOut"
                        className="text-sm text-glass-light cursor-pointer"
                      >
                        Sold Out
                      </Label>
                    </div>
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
                        onKeyDown={handleKeyDown}
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
                        onKeyDown={handleKeyDown}
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
                        onKeyDown={handleKeyDown}
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
                      onKeyDown={handleKeyDown}
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
                      defaultValue="None"
                      value={wipeFormData.faction}
                      onValueChange={(val) => {
                        console.log('Faction selected for wipe:', val);
                        handleFactionChange(val, 'wipe');
                      }}
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
                      onValueChange={(val) => handleClanChange(val, 'wipe')}
                      disabled={wipeFormData.faction === 'None'}
                    >
                      <SelectTrigger className="glass-input border-pink-300/30">
                        <SelectValue placeholder="เลือกตระกูล" />
                      </SelectTrigger>
                      <SelectContent>
                        {wipeFormData.faction !== 'None' && clans[wipeFormData.faction as keyof typeof clans]?.map((clan) => (
                          <SelectItem key={clan} value={clan}>{clan}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wipe-count">จำนวน (ปัจจุบัน: {wipeFormData.currentCount})</Label>
                    <Input
                      id="wipe-count"
                      type="number"
                      placeholder="กรอกจำนวน"
                      className="glass-input border-pink-300/30 focus:border-pink-300/50"
                      value={wipeFormData.count}
                      onChange={(e) => setWipeFormData({...wipeFormData, count: e.target.value})}
                      onKeyDown={handleKeyDown}
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
                            {id.game_id} - {id.clan}
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
                          value={editFormData.is_sold_out ? '❌ Sold Out ❌' : editFormData.game_id}
                          onChange={(e) => !editFormData.is_sold_out && setEditFormData({...editFormData, game_id: e.target.value})}
                          onKeyDown={handleKeyDown}
                          disabled={editFormData.is_sold_out}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-faction">ฝ่าย</Label>
                          <Select
                            defaultValue="None"
                            value={editFormData.faction}
                            onValueChange={(val) => {
                              console.log('Faction selected for edit:', val);
                              handleFactionChange(val, 'edit');
                            }}
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
                            onValueChange={(val) => handleClanChange(val, 'edit')}
                            disabled={editFormData.faction === 'None'}
                          >
                            <SelectTrigger className="glass-input border-pink-300/30">
                              <SelectValue placeholder="เลือกตระกูล" />
                            </SelectTrigger>
                            <SelectContent>
                              {editFormData.faction !== 'None' && clans[editFormData.faction as keyof typeof clans]?.map((clan) => (
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
                            onKeyDown={handleKeyDown}
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
                              {editFormData.faction === 'CCG' ? (
                                ccgRanks.map((rank) => (
                                  <SelectItem key={rank} value={rank}>{rank}</SelectItem>
                                ))
                              ) : (
                                ghoulRanks.map((rank) => (
                                  <SelectItem key={rank} value={rank}>{rank}</SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="edit-kaguneV2"
                            checked={editFormData.is_kagune_v2}
                            onCheckedChange={(checked) =>
                              setEditFormData({...editFormData, is_kagune_v2: checked as boolean})
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
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="edit-soldOut"
                            checked={editFormData.is_sold_out}
                            onCheckedChange={(checked) =>
                              setEditFormData({...editFormData, is_sold_out: checked as boolean})
                            }
                            className="border-pink-300/30 data-[state=checked]:bg-pink-300 data-[state=checked]:border-pink-300"
                          />
                          <Label
                            htmlFor="edit-soldOut"
                            className="text-sm text-glass-light cursor-pointer"
                          >
                            Sold Out
                          </Label>
                        </div>
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
                            onKeyDown={handleKeyDown}
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
                            onKeyDown={handleKeyDown}
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
                            onKeyDown={handleKeyDown}
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
                          onKeyDown={handleKeyDown}
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
                            {id.game_id} - {id.clan}
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

            <TabsContent value="manage-rc" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="border border-pink-300/30 shadow-md">
                  <h3 className="text-lg font-medium text-white mb-4">เพิ่ม RC</h3>
                  <form onSubmit={handleRcManageSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="add-rc">ค่า RC</Label>
                      <Input
                        id="add-rc"
                        placeholder="กรอกค่า RC"
                        className="glass-input border-pink-300/30 focus:border-pink-300/50"
                        value={rcManageData.rc}
                        onChange={(e) => setRcManageData({...rcManageData, rc: e.target.value})}
                        onKeyDown={handleKeyDown}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="add-rc-price">ราคา ($)</Label>
                      <Input
                        id="add-rc-price"
                        type="number"
                        placeholder="ราคา"
                        className="glass-input border-pink-300/30 focus:border-pink-300/50"
                        value={rcManageData.price}
                        onChange={(e) => setRcManageData({...rcManageData, price: e.target.value})}
                        onKeyDown={handleKeyDown}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-pink-300/80 to-pink-400/80 hover:from-pink-300 hover:to-pink-400 text-white border border-pink-300/30 shadow-md transition-all duration-200"
                    >
                      เพิ่ม RC
                    </Button>
                  </form>
                </GlassCard>

                <GlassCard className="border border-pink-300/30 shadow-md">
                  <h3 className="text-lg font-medium text-white mb-4">แก้ไข RC</h3>
                  <form onSubmit={handleEditRcSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="edit-select-rc">เลือก RC เพื่อแก้ไข</Label>
                      <Select
                        value={editRcData.selectedId}
                        onValueChange={handleEditRcSelect}
                      >
                        <SelectTrigger className="glass-input border-pink-300/30">
                          <SelectValue placeholder="เลือก RC" />
                        </SelectTrigger>
                        <SelectContent>
                          {savedRcItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.rc} - ${item.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {editRcData.selectedId && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="edit-rc">ค่า RC</Label>
                          <Input
                            id="edit-rc"
                            placeholder="กรอกค่า RC"
                            className="glass-input border-pink-300/30 focus:border-pink-300/50"
                            value={editRcData.rc}
                            onChange={(e) => setEditRcData({...editRcData, rc: e.target.value})}
                            onKeyDown={handleKeyDown}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-rc-price">ราคา ($)</Label>
                          <Input
                            id="edit-rc-price"
                            type="number"
                            placeholder="ราคา"
                            className="glass-input border-pink-300/30 focus:border-pink-300/50"
                            value={editRcData.price}
                            onChange={(e) => setEditRcData({...editRcData, price: e.target.value})}
                            onKeyDown={handleKeyDown}
                            required
                          />
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-pink-300/80 to-pink-400/80 hover:from-pink-300 hover:to-pink-400 text-white border border-pink-300/30 shadow-md transition-all duration-200"
                        >
                          อัปเดต RC
                        </Button>
                      </>
                    )}
                  </form>
                </GlassCard>

                <GlassCard className="border border-pink-300/30 shadow-md">
                  <h3 className="text-lg font-medium text-white mb-4">ลบ RC</h3>
                  <form onSubmit={handleRemoveRcSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="remove-rc">เลือก RC เพื่อลบ</Label>
                      <Select
                        value={removeRcId}
                        onValueChange={setRemoveRcId}
                      >
                        <SelectTrigger className="glass-input border-pink-300/30">
                          <SelectValue placeholder="เลือก RC" />
                        </SelectTrigger>
                        <SelectContent>
                          {savedRcItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.rc} - ${item.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-red-500/80 hover:bg-red-500 text-white border border-red-300/30 shadow-md transition-all duration-200"
                      disabled={!removeRcId}
                    >
                      ลบ RC ที่เลือก
                    </Button>
                  </form>
                </GlassCard>
              </div>

              <GlassCard className="border border-pink-300/30 shadow-md mt-6">
                <h3 className="text-lg font-medium text-white mb-4">รายการ RC ทั้งหมด</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-pink-300/20">
                        <th className="py-2 px-4 text-left text-pink-300">RC</th>
                        <th className="py-2 px-4 text-left text-pink-300">ราคา ($)</th>
                        <th className="py-2 px-4 text-left text-pink-300">เวลาสร้าง</th>
                        <th className="py-2 px-4 text-left text-pink-300">เวลาอัพเดท</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedRcItems.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-glass-light">ไม่พบข้อมูล RC</td>
                        </tr>
                      ) : (
                        savedRcItems.map((item) => (
                          <tr key={item.id} className="border-b border-pink-300/10 hover:bg-pink-300/5">
                            <td className="py-2 px-4 text-white">{item.rc}</td>
                            <td className="py-2 px-4 text-white">${item.price}</td>
                            <td className="py-2 px-4 text-glass-light">{new Date(item.created_at || '').toLocaleString()}</td>
                            <td className="py-2 px-4 text-glass-light">{new Date(item.updated_at || '').toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;