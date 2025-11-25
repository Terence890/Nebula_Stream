import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Plus, User } from 'lucide-react';
import { toast } from 'sonner';

const Profiles = () => {
  const navigate = useNavigate();
  const { profiles, selectProfile, createProfile, loading } = useProfile();
  const [showDialog, setShowDialog] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  const handleSelectProfile = (profile) => {
    selectProfile(profile);
    navigate('/browse');
  };

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      toast.error('Please enter a profile name');
      return;
    }

    try {
      const profile = await createProfile(newProfileName);
      toast.success('Profile created!');
      setNewProfileName('');
      setShowDialog(false);
      selectProfile(profile);
      navigate('/browse');
    } catch (error) {
      toast.error('Failed to create profile');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center">
        <div className="text-[#00E5FF] text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center p-4" data-testid="profiles-page">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#FF4DD2]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#00E5FF]/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-4xl w-full">
        <h1 className="text-5xl font-bold text-[#E6EEF3] text-center mb-12">
          Who's watching?
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              onClick={() => handleSelectProfile(profile)}
              className="flex flex-col items-center space-y-3 cursor-pointer group"
              data-testid={`profile-${profile.id}`}
            >
              <Avatar className="w-32 h-32 bg-gradient-to-br from-[#00E5FF] to-[#9B7BFF] group-hover:scale-110 transition-transform duration-300 border-4 border-transparent group-hover:border-[#00E5FF]">
                <AvatarFallback className="bg-transparent text-white text-4xl font-bold">
                  {profile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-[#E6EEF3] text-lg font-medium group-hover:text-[#00E5FF] transition-colors">
                {profile.name}
              </span>
            </div>
          ))}

          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <div className="flex flex-col items-center space-y-3 cursor-pointer group" data-testid="add-profile-btn">
                <div className="w-32 h-32 rounded-full bg-white/5 backdrop-blur-sm border-2 border-dashed border-white/20 group-hover:border-[#00E5FF] flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <Plus className="w-12 h-12 text-[#96A0AA] group-hover:text-[#00E5FF]" />
                </div>
                <span className="text-[#E6EEF3] text-lg font-medium group-hover:text-[#00E5FF] transition-colors">
                  Add Profile
                </span>
              </div>
            </DialogTrigger>
            <DialogContent className="bg-[#1a1f2e] border-white/10 text-[#E6EEF3]" data-testid="create-profile-dialog">
              <DialogHeader>
                <DialogTitle className="text-2xl">Create Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="profileName">Profile Name</Label>
                  <Input
                    id="profileName"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    className="bg-white/5 border-white/10 text-[#E6EEF3]"
                    placeholder="Enter name"
                    data-testid="profile-name-input"
                  />
                </div>
                <Button
                  onClick={handleCreateProfile}
                  className="w-full bg-gradient-to-r from-[#00E5FF] to-[#9B7BFF] hover:opacity-90"
                  data-testid="create-profile-submit-btn"
                >
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default Profiles;
