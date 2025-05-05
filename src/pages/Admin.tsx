import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import GlassCard from '@/components/GlassCard';
import { useToast } from '@/hooks/use-toast';
import AdminAuth from '@/components/AdminAuth';
import { useNavigate } from 'react-router-dom';
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
      const adminAuthenticated = sessionStorage.getItem('adminAuthenticated'); 
      setIsAuthenticated(adminAuthenticated === 'true');
    };
  
    checkAuth();
  
    // Load saved IDs for edit/delete functionality
    const loadSavedIds = () => {
      const storedData = localStorage.getItem('idData'); 
      if (storedData) {
        setSavedIds(JSON.parse(storedData));
      }
    };
  
    if (isAuthenticated) {
      loadSavedIds();
    }
  }, [isAuthenticated]);

  // Handle clan faction change
  const handleFactionChange = (faction: string, formType: 'add' | 'edit' | 'wipe') => {
    console.log(`handleFactionChange: faction=${faction}, formType=${formType}`);
    
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
      console.log(`Updating rcFormData: faction=${faction}, clan=${newClan}, kagune=${newKagune}`);
      setRcFormData({
        ...rcFormData,
        faction: faction,
        clan: newClan,
        kagune: newKagune
      });
    } else if (formType === 'edit') {
      console.log(`Updating editFormData: faction=${faction}, clan=${newClan}, kagune=${newKagune}`);
      setEditFormData({
        ...editFormData,
        faction: faction,
        clan: newClan,
        kagune: newKagune
      });
    } else if (formType === 'wipe') {
      console.log(`Updating wipeFormData: faction=${faction}, clan=${newClan}`);
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
        variant: "destructive"
      });
      return;
    }
    
    // Validate faction and clan compatibility
    if (rcFormData.faction === 'Ghoul' && !['Yoshimura', 'Kaneki'].includes(rcFormData.clan)) {
      toast({
        title: "Error",
        description: "Invalid clan for Ghoul faction. Please select Yoshimura or Kaneki.",
        variant: "destructive"
      });
      return;
    }
    
    // Get existing ID data from localStorage
    const storedData = localStorage.getItem('idData');
    const idData = storedData ? JSON.parse(storedData) : [];
    
    // Add new ID data
    const newIdData = {
      ...rcFormData,
      rc: parseInt(rcFormData.rc),
      gp: parseInt(rcFormData.gp),
      price: parseInt(rcFormData.price)
    };
    
    idData.push(newIdData);
    
    // Save back to localStorage
    localStorage.setItem('idData', JSON.stringify(idData));
    
    toast({
      title: "Success",
      description: `Added ID: ${rcFormData.id}`,
    });
    
    // Reset form but keep faction and clan
    console.log(`Resetting rcFormData: keeping faction=${rcFormData.faction}, clan=${rcFormData.clan}`);
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

    // Refresh saved IDs
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
        variant: "destructive"
      });
      return;
    }
    
    if (!wipeFormData.count) {
      toast({
        title: "Error",
        description: "Please enter a count value",
        variant: "destructive"
      });
      return;
    }
    
    // Validate faction and clan compatibility
    if (wipeFormData.faction === 'Ghoul' && !['Yoshimura', 'Kaneki'].includes(wipeFormData.clan)) {
      toast({
        title: "Error",
        description: "Invalid clan for Ghoul faction. Please select Yoshimura or Kaneki.",
        variant: "destructive"
      });
      return;
    }
    
    // Get existing wipe data from localStorage
    const storedData = localStorage.getItem('wipeData');
    const wipeData = storedData ? JSON.parse(storedData) : [];
    
    // Find if clan already exists in data
    const clanIndex = wipeData.findIndex((item: any) => 
      item.clan === wipeFormData.clan && item.faction === wipeFormData.faction
    );
    
    if (clanIndex >= 0) {
      // Update count if clan exists
      wipeData[clanIndex].count = parseInt(wipeFormData.count);
    } else {
      // Add new clan data
      wipeData.push({
        clan: wipeFormData.clan,
        faction: wipeFormData.faction,
        count: parseInt(wipeFormData.count)
      });
    }
    
    // Save back to localStorage
    localStorage.setItem('wipeData', JSON.stringify(wipeData));
    
    toast({
      title: "Success",
      description: `Updated ${wipeFormData.clan} count to ${wipeFormData.count}`,
    });
    
    // Reset form but keep faction and clan
    console.log(`Resetting wipeFormData: keeping faction=${wipeFormData.faction}, clan=${wipeFormData.clan}`);
    setWipeFormData({ 
      clan: wipeFormData.clan, 
      faction: wipeFormData.faction, 
      count: '' 
    });
  };

  const handleIdSelect = (selectedId: string) => {
    const idToEdit = savedIds.find(id => id.id === selectedId);
    
    if (idToEdit) {
      console.log(`Selected ID: ${selectedId}, setting editFormData`);
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
        variant: "destructive"
      });
      return;
    }
    
    // Validate faction and clan compatibility
    if (editFormData.faction === 'Ghoul' && !['Yoshimura', 'Kaneki'].includes(editFormData.clan)) {
      toast({
        title: "Error",
        description: "Invalid clan for Ghoul faction. Please select Yoshimura or Kaneki.",
        variant: "destructive"
      });
      return;
    }
    
    // Get existing ID data from localStorage
    const storedData = localStorage.getItem('idData');
    let idData = storedData ? JSON.parse(storedData) : [];
    
    // Find the ID to edit
    const idIndex = idData.findIndex((item: IdData) => item.id === editFormData.selectedId);
    
    if (idIndex >= 0) {
      // Update the ID data
      idData[idIndex] = {
        ...idData[idIndex],
        id: editFormData.id,
        clan: editFormData.clan,
        kagune: editFormData.kagune,
        isKaguneV2: editFormData.isKaguneV2,
        rank: editFormData.rank,
        rc: parseInt(editFormData.rc),
        gp: parseInt(editFormData.gp),
        price: parseInt(editFormData.price),
        link: editFormData.link,
        isActive: editFormData.isActive
      };
      
      // Save back to localStorage
      localStorage.setItem('idData', JSON.stringify(idData));
      
      toast({
        title: "Success",
        description: `Updated ID: ${editFormData.id}`,
      });
      
      // Refresh saved IDs
      setSavedIds(idData);
      
      // Reset form but keep faction and clan
      console.log(`Resetting editFormData: keeping faction=${editFormData.faction}, clan=${editFormData.clan}`);
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
        variant: "destructive"
      });
    }
  };

  const handleRemoveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get existing ID data from localStorage
    const storedData = localStorage.getItem('idData');
    let idData = storedData ? JSON.parse(storedData) : [];
    
    // Filter out the ID to remove
    const newIdData = idData.filter((item: IdData) => item.id !== removeId);
    
    if (newIdData.length < idData.length) {
      // Save back to localStorage
      localStorage.setItem('idData', JSON.stringify(newIdData));
      
      toast({
        title: "Success",
        description: `Removed ID: ${removeId}`,
      });
      
      // Refresh saved IDs
      setSavedIds(newIdData);
      
      // Reset form
      setRemoveId('');
    } else {
      toast({
        title: "Error",
        description: "ID not found",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuthenticated'); 
    setIsAuthenticated(false);
    navigate('/');
  };

  if (!isAuthenticated) {
    return <AdminAuth />;
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
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            <span className="text-pink-300">Admin</span> Dashboard
          </h1>
          <p className="text-glass-light">Add and manage ID data</p>
        </div>

        <div className="mb-6 text-right">
          <Button 
            onClick={handleLogout}
            className="bg-glass-dark/40 text-pink-300 hover:bg-glass-dark/60 hover:text-pink-300 border border-pink-300/30"
          >
            Logout
          </Button>
        </div>

        <Tabs defaultValue="add-id" className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList className="bg-glass-dark/40 backdrop-blur-sm border border-pink-300/20 shadow-lg shadow-pink-500/10">
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
            {/* Add ID Tab */}
            <TabsContent value="add-id" className="mt-0">
              <GlassCard className="border border-pink-300/30 shadow-lg shadow-pink-500/10">
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
                        onValueChange={(val) => {
                          console.log(`rcFormData faction change: ${val}`);
                          handleFactionChange(val, 'add');
                        }}
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
                      <Select 
                        key={rcFormData.faction}
                        value={rcFormData.clan}
                        onValueChange={(val) => {
                          console.log(`rcFormData clan change: ${val}`);
                          if (val && clans[rcFormData.faction]?.includes(val)) {
                            setRcFormData({...rcFormData, clan: val});
                          }
                        }}
                        disabled={rcFormData.faction === 'None'}
                      >
                        <SelectTrigger className="glass-input border-pink-300/30">
                          <SelectValue placeholder="Select Clan" />
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
                      <Label htmlFor="rc-kagune">Kagune</Label>
                      <Input 
                        id="rc-kagune" 
                        placeholder="Enter Kagune" 
                        className="glass-input border-pink-300/30 focus:border-pink-300/50"
                        value={rcFormData.kagune}
                        onChange={(e) => setRcFormData({...rcFormData, kagune: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="rc-rank">Rank</Label>
                      <Select 
                        value={rcFormData.rank}
                        onValueChange={(val) => setRcFormData({...rcFormData, rank: val})}
                      >
                        <SelectTrigger className="glass-input border-pink-300/30">
                          <SelectValue placeholder="Select Rank" />
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
                      Has Kagune V2
                    </Label>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rc-rc">RC Value</Label>
                      <Input 
                        id="rc-rc" 
                        type="number"
                        placeholder="RC Value" 
                        className="glass-input border-pink-300/30 focus:border-pink-300/50"
                        value={rcFormData.rc}
                        onChange={(e) => setRcFormData({...rcFormData, rc: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="rc-gp">GP Value</Label>
                      <Input 
                        id="rc-gp" 
                        type="number"
                        placeholder="GP Value" 
                        className="glass-input border-pink-300/30 focus:border-pink-300/50"
                        value={rcFormData.gp}
                        onChange={(e) => setRcFormData({...rcFormData, gp: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="rc-price">Price ($)</Label>
                      <Input 
                        id="rc-price" 
                        type="number"
                        placeholder="Price" 
                        className="glass-input border-pink-300/30 focus:border-pink-300/50"
                        value={rcFormData.price}
                        onChange={(e) => setRcFormData({...rcFormData, price: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="rc-link">Buy Link</Label>
                    <Input 
                      id="rc-link" 
                      placeholder="Enter link" 
                      className="glass-input border-pink-300/30 focus:border-pink-300/50"
                      value={rcFormData.link}
                      onChange={(e) => setRcFormData({...rcFormData, link: e.target.value})}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full button-3d"
                  >
                    Add ID
                  </Button>
                </form>
              </GlassCard>
            </TabsContent>

            {/* Add Clan ID Tab */}
            <TabsContent value="add-clan" className="mt-0">
              <GlassCard className="border border-pink-300/30 shadow-lg shadow-pink-500/10">
                <form onSubmit={handleWipeSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="wipe-faction">Faction</Label>
                    <Select 
                      value={wipeFormData.faction}
                      onValueChange={(val) => {
                        console.log(`wipeFormData faction change: ${val}`);
                        handleFactionChange(val, 'wipe');
                      }}
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
                    <Label htmlFor="wipe-clan">Clan</Label>
                    <Select 
                      key={wipeFormData.faction}
                      value={wipeFormData.clan}
                      onValueChange={(val) => {
                        console.log(`wipeFormData clan change: ${val}`);
                        if (val && clans[wipeFormData.faction]?.includes(val)) {
                          setWipeFormData({...wipeFormData, clan: val});
                        }
                      }}
                      disabled={wipeFormData.faction === 'None'}
                    >
                      <SelectTrigger className="glass-input border-pink-300/30">
                        <SelectValue placeholder="Select Clan" />
                      </SelectTrigger>
                      <SelectContent>
                        {wipeFormData.faction !== 'None' && clans[wipeFormData.faction]?.map((clan) => (
                          <SelectItem key={clan} value={clan}>{clan}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="wipe-count">Count</Label>
                    <Input 
                      id="wipe-count" 
                      type="number"
                      placeholder="Enter Count" 
                      className="glass-input border-pink-300/30 focus:border-pink-300/50"
                      value={wipeFormData.count}
                      onChange={(e) => setWipeFormData({...wipeFormData, count: e.target.value})}
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full button-3d"
                  >
                    Update Clan Count
                  </Button>
                </form>
              </GlassCard>
            </TabsContent>

            {/* Edit ID Tab */}
            <TabsContent value="edit-id" className="mt-0">
              <GlassCard className="border border-pink-300/30 shadow-lg shadow-pink-500/10">
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
                          placeholder="Enter ID" 
                          className="glass-input border-pink-300/30 focus:border-pink-300/50"
                          value={editFormData.id}
                          onChange={(e) => setEditFormData({...editFormData, id: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-faction">Faction</Label>
                          <Select 
                            value={editFormData.faction}
                            onValueChange={(val) => {
                              console.log(`editFormData faction change: ${val}`);
                              handleFactionChange(val, 'edit');
                            }}
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
                          <Label htmlFor="edit-clan">Clan</Label>
                          <Select 
                            key={editFormData.faction}
                            value={editFormData.clan}
                            onValueChange={(val) => {
                              console.log(`editFormData clan change: ${val}`);
                              if (val && clans[editFormData.faction]?.includes(val)) {
                                setEditFormData({...editFormData, clan: val});
                              }
                            }}
                            disabled={editFormData.faction === 'None'}
                          >
                            <SelectTrigger className="glass-input border-pink-300/30">
                              <SelectValue placeholder="Select Clan" />
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
                          <Label htmlFor="edit-kagune">Kagune</Label>
                          <Input 
                            id="edit-kagune" 
                            placeholder="Enter Kagune" 
                            className="glass-input border-pink-300/30 focus:border-pink-300/50"
                            value={editFormData.kagune}
                            onChange={(e) => setEditFormData({...editFormData, kagune: e.target.value})}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="edit-rank">Rank</Label>
                          <Select 
                            value={editFormData.rank}
                            onValueChange={(val) => setEditFormData({...editFormData, rank: val})}
                          >
                            <SelectTrigger className="glass-input border-pink-300/30">
                              <SelectValue placeholder="Select Rank" />
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
                          Has Kagune V2
                        </Label>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-rc">RC Value</Label>
                          <Input 
                            id="edit-rc" 
                            type="number"
                            placeholder="RC Value" 
                            className="glass-input border-pink-300/30 focus:border-pink-300/50"
                            value={editFormData.rc}
                            onChange={(e) => setEditFormData({...editFormData, rc: e.target.value})}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="edit-gp">GP Value</Label>
                          <Input 
                            id="edit-gp" 
                            type="number"
                            placeholder="GP Value" 
                            className="glass-input border-pink-300/30 focus:border-pink-300/50"
                            value={editFormData.gp}
                            onChange={(e) => setEditFormData({...editFormData, gp: e.target.value})}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="edit-price">Price ($)</Label>
                          <Input 
                            id="edit-price" 
                            type="number"
                            placeholder="Price" 
                            className="glass-input border-pink-300/30 focus:border-pink-300/50"
                            value={editFormData.price}
                            onChange={(e) => setEditFormData({...editFormData, price: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="edit-link">Buy Link</Label>
                        <Input 
                          id="edit-link" 
                          placeholder="Enter link" 
                          className="glass-input border-pink-300/30 focus:border-pink-300/50"
                          value={editFormData.link}
                          onChange={(e) => setEditFormData({...editFormData, link: e.target.value})}
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full button-3d"
                      >
                        Update ID
                      </Button>
                    </>
                  )}
                </form>
              </GlassCard>
            </TabsContent>

            {/* Remove ID Tab */}
            <TabsContent value="remove-id" className="mt-0">
              <GlassCard className="border border-pink-300/30 shadow-lg shadow-pink-500/10">
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
                            {id.id} - {id.clan}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-red-500/80 hover:bg-red-500 text-white border border-red-300/30 shadow-lg transition-all duration-300"
                    disabled={!removeId}
                  >
                    Remove Selected ID
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