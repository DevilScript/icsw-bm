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
        toast({
          title: "Error",
          description: "Failed to load data",
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
          const { data, error } = await supabase
            .from('set_rc')
            .select('*');
          if (error) {
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
          const { data, error } = await supabase
            .from('set_clan')
            .select('*');
          if (error) {
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
    } else if (formType === 'edit') {
      setEditFormData(prev => ({
        ...prev,
        faction,
        clan: newClan,
        kagune: newKagune,
        rank: faction === 'CCG' ? ccgRanks[0] : prev.rank || ghoulRanks[0]
      }));
    } else if (formType === 'wipe') {
      const currentClan = savedClans.find(c => c.clan === newClan && c.faction === faction);
      setWipeFormData(prev => ({
        ...prev,
        faction,
        clan: newClan,
        currentCount: currentClan ? currentClan.count : 0
      }));
    }
  };

  const handleClanChange = (clan: string, formType: 'add' | 'edit' | 'wipe') => {
    if (formType === 'add') {
      setRcFormData(prev => ({
        ...prev,
        clan
      }));
    } else if (formType === 'edit') {
      setEditFormData(prev => ({
        ...prev,
        clan
      }));
    } else if (formType === 'wipe') {
      const currentClan = savedClans.find(c => c.clan === clan && c.faction === wipeFormData.faction);
      setWipeFormData(prev => ({
        ...prev,
        clan,
        currentCount: currentClan ? currentClan.count : 0
      }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const handleRcSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (factionAdd === 'None') {
      toast({
        title: "Error",
        description: "Please select a faction (CCG or Ghoul)",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }

    if (factionAdd === 'Ghoul' && !['Yoshimura', 'Kaneki'].includes(rcFormData.clan)) {
      toast({
        title: "Error",
        description: "Invalid clan for Ghoul faction. Please select Yoshimura or Kaneki",
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

      const { error } = await supabase
        .from('set_id')
        .insert([newIdData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Added ID: ${newIdData.game_id}`,
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

      const { data } = await supabase
        .from('set_id')
        .select('*');
      if (data) setSavedIds(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save ID data",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const handleWipeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (wipeFormData.faction === 'None') {
      toast({
        title: "Error",
        description: "Please select a faction (CCG or Ghoul)",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }

    if (!wipeFormData.count) {
      toast({
        title: "Error",
        description: "Please enter a count",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }

    if (wipeFormData.faction === 'Ghoul' && !['Yoshimura', 'Kaneki'].includes(wipeFormData.clan)) {
      toast({
        title: "Error",
        description: "Invalid clan for Ghoul faction. Please select Yoshimura or Kaneki",
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
        title: "Success",
        description: `Updated count for ${wipeFormData.clan} to ${wipeFormData.count}`,
        duration: 5000,
      });

      setWipeFormData({
        clan: wipeFormData.clan,
        faction: wipeFormData.faction,
        count: '',
        currentCount: parseInt(wipeFormData.count)
      });

      const { data } = await supabase
        .from('set_clan')
        .select('*');
      if (data) setSavedClans(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save clan data",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const handleIdSelect = async (selectedId: string) => {
    try {
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
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to select ID for editing",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editFormData.faction === 'None') {
      toast({
        title: "Error",
        description: "Please select a faction (CCG or Ghoul)",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }

    if (editFormData.faction === 'Ghoul' && !['Yoshimura', 'Kaneki'].includes(editFormData.clan)) {
      toast({
        title: "Error",
        description: "Invalid clan for Ghoul faction. Please select Yoshimura or Kaneki",
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

      const { error } = await supabase
        .from('set_id')
        .update(updatedId)
        .eq('id', editFormData.selectedId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Updated ID: ${updatedId.game_id}`,
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update ID data",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const handleRemoveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('set_id')
        .delete()
        .eq('id', removeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `ID deleted successfully`,
        duration: 5000,
      });

      const { data } = await supabase
        .from('set_id')
        .select('*');
      if (data) setSavedIds(data);

      setRemoveId('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete ID data",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const handleRcManageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rcManageData.rc || !rcManageData.price) {
      toast({
        title: "Error",
        description: "Please enter RC and price",
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

      const { error } = await supabase
        .from('set_rc')
        .insert([newRcData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Added RC: ${rcManageData.rc}`,
        duration: 5000,
      });

      setRcManageData({
        rc: '',
        price: '',
      });

      const { data } = await supabase
        .from('set_rc')
        .select('*');
      if (data) setSavedRcItems(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save RC data",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const handleEditRcSelect = async (selectedId: string) => {
    try {
      const rcToEdit = savedRcItems.find(item => item.id === selectedId);

      if (rcToEdit) {
        setEditRcData({
          selectedId,
          rc: rcToEdit.rc,
          price: rcToEdit.price.toString(),
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to select RC for editing",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const handleEditRcSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editRcData.rc || !editRcData.price) {
      toast({
        title: "Error",
        description: "Please enter RC and price",
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

      const { error } = await supabase
        .from('set_rc')
        .update(updatedRc)
        .eq('id', editRcData.selectedId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Updated RC: ${editRcData.rc}`,
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update RC data",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const handleRemoveRcSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('set_rc')
        .delete()
        .eq('id', removeRcId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `RC deleted successfully`,
        duration: 5000,
      });

      const { data } = await supabase
        .from('set_rc')
        .select('*');
      if (data) setSavedRcItems(data);

      setRemoveRcId('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete RC data",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const handleLogout = () => {
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
    return <Navigate to="/admin-auth" replace />;
  }

  const clans = {
    CCG: ['Arima', 'Suzuya'],
    Ghoul: ['Yoshimura', 'Kaneki']
  };

  const isAddFormDisabled = factionAdd === 'None';

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
                Add Clan
              </TabsTrigger>
              <TabsTrigger value="edit-id" className="data-[state=active]:bg-pink-300/80 data-[state=active]:text-white">
                Edit ID
              </TabsTrigger>
              <TabsTrigger value="remove-id" className="data-[state=active]:bg-pink-300/80 data-[state=active]:text-white">
                Remove ID
              </TabsTrigger>
              <TabsTrigger value="manage-rc" className="data-[state=active]:bg-pink-300/80 data-[state=active]:text-white">
                Manage RC
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
                      value={rcFormData.is_sold_out ? '❌ Sold Out ❌' : rcFormData.game_id}
                      onChange={(e) => !rcFormData.is_sold_out && setRcFormData({...rcFormData, game_id: e.target.value})}
                      onKeyDown={handleKeyDown}
                      disabled={rcFormData.is_sold_out}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rc-faction">Faction</Label>
                      <Select
                        value={factionAdd}
                        onValueChange={(val) => handleFactionChange(val, 'add')}
                      >
                        <SelectTrigger className="glass-input border-pink-300/30">
                          <SelectValue placeholder="Select faction" />
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
                      <Select
                        value={rcFormData.clan}
                        onValueChange={(val) => handleClanChange(val, 'add')}
                        disabled={isAddFormDisabled}
                      >
                        <SelectTrigger className="glass-input border-pink-300/30">
                          <SelectValue placeholder="Select clan" />
                        </SelectTrigger>
                        <SelectContent>
                          {factionAdd !== 'None' && clans[factionAdd as keyof typeof clans]?.map((clan) => (
                            <SelectItem key={clan} value={clan}>{clan}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rc-kagune">Weapon</Label>
                      <Input
                        id="rc-kagune"
                        placeholder="Kagune / Quinque"
                        className="glass-input border-pink-300/30 focus:border-pink-300/50"
                        value={rcFormData.kagune}
                        onChange={(e) => setRcFormData({...rcFormData, kagune: e.target.value})}
                        onKeyDown={handleKeyDown}
                        disabled={isAddFormDisabled}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rc-rank">Rank</Label>
                      <Select
                        value={rcFormData.rank}
                        onValueChange={(val) => setRcFormData({...rcFormData, rank: val})}
                        disabled={isAddFormDisabled}
                      >
                        <SelectTrigger className="glass-input border-pink-300/30">
                          <SelectValue placeholder="Select rank" />
                        </SelectTrigger>
                        <SelectContent>
                          {factionAdd === 'CCG' ? (
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
                        disabled={isAddFormDisabled}
                        className="border-pink-300/30 data-[state=checked]:bg-pink-300 data-[state=checked]:border-pink-300"
                      />
                      <Label
                        htmlFor="kaguneV2"
                        className="text-sm text-glass-light cursor-pointer"
                      >
                        Has Kagune V2
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="soldOut"
                        checked={rcFormData.is_sold_out}
                        onCheckedChange={(checked) =>
                          setRcFormData({...rcFormData, is_sold_out: checked as boolean})
                        }
                        disabled={isAddFormDisabled}
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
                      <Label htmlFor="rc-rc">RC</Label>
                      <Input
                        id="rc-rc"
                        type="number"
                        placeholder="Enter RC"
                        className="glass-input border-pink-300/30 focus:border-pink-300/50"
                        value={rcFormData.rc}
                        onChange={(e) => setRcFormData({...rcFormData, rc: e.target.value})}
                        onKeyDown={handleKeyDown}
                        disabled={isAddFormDisabled}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rc-gp">GP</Label>
                      <Input
                        id="rc-gp"
                        type="number"
                        placeholder="Enter GP"
                        className="glass-input border-pink-300/30 focus:border-pink-300/50"
                        value={rcFormData.gp}
                        onChange={(e) => setRcFormData({...rcFormData, gp: e.target.value})}
                        onKeyDown={handleKeyDown}
                        disabled={isAddFormDisabled}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rc-price">Price ($)</Label>
                      <Input
                        id="rc-price"
                        type="number"
                        placeholder="Enter price"
                        className="glass-input border-pink-300/30 focus:border-pink-300/50"
                        value={rcFormData.price}
                        onChange={(e) => setRcFormData({...rcFormData, price: e.target.value})}
                        onKeyDown={handleKeyDown}
                        disabled={isAddFormDisabled}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rc-link">Purchase Link</Label>
                    <Input
                      id="rc-link"
                      placeholder="Enter link"
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
                    Add ID
                  </Button>
                </form>
              </GlassCard>
            </TabsContent>

            <TabsContent value="add-clan" className="mt-0">
              <GlassCard className="border border-pink-300/30 shadow-md">
                <form onSubmit={handleWipeSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="wipe-faction">Faction</Label>
                    <Select
                      defaultValue="None"
                      value={wipeFormData.faction}
                      onValueChange={(val) => handleFactionChange(val, 'wipe')}
                    >
                      <SelectTrigger className="glass-input border-pink-300/30">
                        <SelectValue placeholder="Select faction" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="None">None</SelectItem>
                        <SelectItem value="CCG">CCG</SelectItem>
                        <SelectItem value="Ghoul">Ghoul</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wipe-clan">Clan</Label>
                    <Select
                      value={wipeFormData.clan}
                      onValueChange={(val) => handleClanChange(val, 'wipe')}
                      disabled={wipeFormData.faction === 'None'}
                    >
                      <SelectTrigger className="glass-input border-pink-300/30">
                        <SelectValue placeholder="Select clan" />
                      </SelectTrigger>
                      <SelectContent>
                        {wipeFormData.faction !== 'None' && clans[wipeFormData.faction as keyof typeof clans]?.map((clan) => (
                          <SelectItem key={clan} value={clan}>{clan}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wipe-count">Count (Current: {wipeFormData.currentCount})</Label>
                    <Input
                      id="wipe-count"
                      type="number"
                      placeholder="Enter count"
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
                    Update Clan Count
                  </Button>
                </form>
              </GlassCard>
            </TabsContent>

            <TabsContent value="edit-id" className="mt-0">
              <GlassCard className="border border-pink-300/30 shadow-md">
                <form onSubmit={handleEditSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="edit-select-id">Select ID to Edit</Label>
                    <Select
                      value={editFormData.selectedId}
                      onValueChange={handleIdSelect}
                    >
                      <SelectTrigger className="glass-input border-pink-300/30">
                        <SelectValue placeholder="Select ID" />
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
                          placeholder="Enter ID"
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
                          <Label htmlFor="edit-faction">Faction</Label>
                          <Select
                            defaultValue="None"
                            value={editFormData.faction}
                            onValueChange={(val) => handleFactionChange(val, 'edit')}
                          >
                            <SelectTrigger className="glass-input border-pink-300/30">
                              <SelectValue placeholder="Select faction" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="None">None</SelectItem>
                              <SelectItem value="CCG">CCG</SelectItem>
                              <SelectItem value="Ghoul">Ghoul</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-clan">Clan</Label>
                          <Select
                            value={editFormData.clan}
                            onValueChange={(val) => handleClanChange(val, 'edit')}
                            disabled={editFormData.faction === 'None'}
                          >
                            <SelectTrigger className="glass-input border-pink-300/30">
                              <SelectValue placeholder="Select clan" />
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
                          <Label htmlFor="edit-kagune">Weapon</Label>
                          <Input
                            id="edit-kagune"
                            placeholder="Kagune / Quinque"
                            className="glass-input border-pink-300/30 focus:border-pink-300/50"
                            value={editFormData.kagune}
                            onChange={(e) => setEditFormData({...editFormData, kagune: e.target.value})}
                            onKeyDown={handleKeyDown}
                            disabled={editFormData.faction === 'None'}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-rank">Rank</Label>
                          <Select
                            value={editFormData.rank}
                            onValueChange={(val) => setEditFormData({...editFormData, rank: val})}
                            disabled={editFormData.faction === 'None'}
                          >
                            <SelectTrigger className="glass-input border-pink-300/30">
                              <SelectValue placeholder="Select rank" />
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
                            disabled={editFormData.faction === 'None'}
                            className="border-pink-300/30 data-[state=checked]:bg-pink-300 data-[state=checked]:border-pink-300"
                          />
                          <Label
                            htmlFor="edit-kaguneV2"
                            className="text-sm text-glass-light cursor-pointer"
                          >
                            Has Kagune V2
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="edit-soldOut"
                            checked={editFormData.is_sold_out}
                            onCheckedChange={(checked) =>
                              setEditFormData({...editFormData, is_sold_out: checked as boolean})
                            }
                            disabled={editFormData.faction === 'None'}
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
                          <Label htmlFor="edit-rc">RC</Label>
                          <Input
                            id="edit-rc"
                            type="number"
                            placeholder="Enter RC"
                            className="glass-input border-pink-300/30 focus:border-pink-300/50"
                            value={editFormData.rc}
                            onChange={(e) => setEditFormData({...editFormData, rc: e.target.value})}
                            onKeyDown={handleKeyDown}
                            disabled={editFormData.faction === 'None'}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-gp">GP</Label>
                          <Input
                            id="edit-gp"
                            type="number"
                            placeholder="Enter GP"
                            className="glass-input border-pink-300/30 focus:border-pink-300/50"
                            value={editFormData.gp}
                            onChange={(e) => setEditFormData({...editFormData, gp: e.target.value})}
                            onKeyDown={handleKeyDown}
                            disabled={editFormData.faction === 'None'}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-price">Price ($)</Label>
                          <Input
                            id="edit-price"
                            type="number"
                            placeholder="Enter price"
                            className="glass-input border-pink-300/30 focus:border-pink-300/50"
                            value={editFormData.price}
                            onChange={(e) => setEditFormData({...editFormData, price: e.target.value})}
                            onKeyDown={handleKeyDown}
                            disabled={editFormData.faction === 'None'}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-link">Purchase Link</Label>
                        <Input
                          id="edit-link"
                          placeholder="Enter link"
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
                        Update ID
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
                    <Label htmlFor="remove-id">Select ID to Remove</Label>
                    <Select
                      value={removeId}
                      onValueChange={setRemoveId}
                    >
                      <SelectTrigger className="glass-input border-pink-300/30">
                        <SelectValue placeholder="Select ID" />
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
                    Remove Selected ID
                  </Button>
                </form>
              </GlassCard>
            </TabsContent>

            <TabsContent value="manage-rc" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="border border-pink-300/30 shadow-md">
                  <h3 className="text-lg font-medium text-white mb-4">Add RC</h3>
                  <form onSubmit={handleRcManageSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="add-rc">RC</Label>
                      <Input
                        id="add-rc"
                        placeholder="Enter RC"
                        className="glass-input border-pink-300/30 focus:border-pink-300/50"
                        value={rcManageData.rc}
                        onChange={(e) => setRcManageData({...rcManageData, rc: e.target.value})}
                        onKeyDown={handleKeyDown}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="add-rc-price">Price ($)</Label>
                      <Input
                        id="add-rc-price"
                        type="number"
                        placeholder="Enter price"
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
                      Add RC
                    </Button>
                  </form>
                </GlassCard>

                <GlassCard className="border border-pink-300/30 shadow-md">
                  <h3 className="text-lg font-medium text-white mb-4">Edit RC</h3>
                  <form onSubmit={handleEditRcSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="edit-select-rc">Select RC to Edit</Label>
                      <Select
                        value={editRcData.selectedId}
                        onValueChange={handleEditRcSelect}
                      >
                        <SelectTrigger className="glass-input border-pink-300/30">
                          <SelectValue placeholder="Select RC" />
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
                          <Label htmlFor="edit-rc">RC</Label>
                          <Input
                            id="edit-rc"
                            placeholder="Enter RC"
                            className="glass-input border-pink-300/30 focus:border-pink-300/50"
                            value={editRcData.rc}
                            onChange={(e) => setEditRcData({...editRcData, rc: e.target.value})}
                            onKeyDown={handleKeyDown}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-rc-price">Price ($)</Label>
                          <Input
                            id="edit-rc-price"
                            type="number"
                            placeholder="Enter price"
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
                          Update RC
                        </Button>
                      </>
                    )}
                  </form>
                </GlassCard>

                <GlassCard className="border border-pink-300/30 shadow-md">
                  <h3 className="text-lg font-medium text-white mb-4">Remove RC</h3>
                  <form onSubmit={handleRemoveRcSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="remove-rc">Select RC to Remove</Label>
                      <Select
                        value={removeRcId}
                        onValueChange={setRemoveRcId}
                      >
                        <SelectTrigger className="glass-input border-pink-300/30">
                          <SelectValue placeholder="Select RC" />
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
                      Remove Selected RC
                    </Button>
                  </form>
                </GlassCard>
              </div>

              <GlassCard className="border border-pink-300/30 shadow-md mt-6">
                <h3 className="text-lg font-medium text-white mb-4">All RC Entries</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-pink-300/20">
                        <th className="py-2 px-4 text-left text-pink-300">RC</th>
                        <th className="py-2 px-4 text-left text-pink-300">Price ($)</th>
                        <th className="py-2 px-4 text-left text-pink-300">Created At</th>
                        <th className="py-2 px-4 text-left text-pink-300">Updated At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedRcItems.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-glass-light">No RC data found</td>
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