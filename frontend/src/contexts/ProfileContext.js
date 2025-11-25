import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const ProfileContext = createContext();

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const ProfileProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && token) {
      fetchProfiles();
    }
  }, [user, token]);

  useEffect(() => {
    const saved = localStorage.getItem('selectedProfile');
    if (saved && profiles.length > 0) {
      const profile = profiles.find(p => p.id === saved);
      if (profile) setSelectedProfile(profile);
    }
  }, [profiles]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/profiles`);
      setProfiles(response.data);
    } catch (error) {
      console.error('Failed to fetch profiles', error);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (name, isKids = false) => {
    const response = await axios.post(`${API}/profiles`, { name, is_kids: isKids });
    setProfiles([...profiles, response.data]);
    return response.data;
  };

  const selectProfile = (profile) => {
    setSelectedProfile(profile);
    localStorage.setItem('selectedProfile', profile.id);
  };

  return (
    <ProfileContext.Provider value={{ profiles, selectedProfile, selectProfile, createProfile, loading }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
