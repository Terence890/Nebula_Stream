import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import TitleCard from '../components/TitleCard';
import VideoPlayer from '../components/VideoPlayer';
import { Dialog, DialogContent } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Play, Plus, Info, Star } from 'lucide-react';
import { useProfile } from '../contexts/ProfileContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const IMAGE_BASE = 'https://image.tmdb.org/t/p';

const Browse = () => {
  const navigate = useNavigate();
  const { selectedProfile } = useProfile();
  const [trending, setTrending] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularTV, setPopularTV] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [titleDetails, setTitleDetails] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [heroTitle, setHeroTitle] = useState(null);

  useEffect(() => {
    if (!selectedProfile) {
      navigate('/profiles');
      return;
    }
    fetchData();
  }, [selectedProfile]);

  const fetchData = async () => {
    try {
      const [trendingRes, moviesRes, tvRes] = await Promise.all([
        axios.get(`${API}/titles/trending`),
        axios.get(`${API}/titles/popular?media_type=movie`),
        axios.get(`${API}/titles/popular?media_type=tv`)
      ]);

      setTrending(trendingRes.data?.results || []);
      setPopularMovies(moviesRes.data?.results || []);
      setPopularTV(tvRes.data?.results || []);
      setHeroTitle(trendingRes.data?.results?.[0]);
    } catch (error) {
      console.error('Failed to fetch titles', error);
      toast.error('Failed to load content');
    }
  };

  const handleSearch = async (query) => {
    try {
      const response = await axios.get(`${API}/titles/search?query=${query}`);
      setSearchResults(response.data.results || []);
    } catch (error) {
      console.error('Search failed', error);
      toast.error('Search failed');
    }
  };

  const handleTitleClick = async (title) => {
    setSelectedTitle(title);
    const mediaType = title.media_type || (title.title ? 'movie' : 'tv');
    try {
      const response = await axios.get(`${API}/titles/${mediaType}/${title.id}`);
      setTitleDetails(response.data);
    } catch (error) {
      console.error('Failed to fetch title details', error);
    }
  };

  const handlePlay = (title) => {
    const trailers = titleDetails?.videos?.results?.filter(v => v.type === 'Trailer') || [];
    if (trailers.length > 0) {
      const youtubeKey = trailers[0].key;
      setVideoUrl(`https://www.youtube.com/embed/${youtubeKey}?autoplay=1`);
      setShowPlayer(true);
    } else {
      toast.info('No trailer available for this title');
    }
  };

  const handleAddToWatchlist = async () => {
    if (!selectedProfile || !selectedTitle) return;
    try {
      const mediaType = selectedTitle.media_type || (selectedTitle.title ? 'movie' : 'tv');
      await axios.post(`${API}/watchlist?profile_id=${selectedProfile.id}`, {
        tmdb_id: selectedTitle.id,
        media_type: mediaType
      });
      toast.success('Added to watchlist');
    } catch (error) {
      toast.error('Failed to add to watchlist');
    }
  };

  const renderHero = () => {
    if (!heroTitle) return null;
    const backdropUrl = heroTitle.backdrop_path
      ? `${IMAGE_BASE}/original${heroTitle.backdrop_path}`
      : 'https://via.placeholder.com/1920x1080/0B0F14/00E5FF?text=NebulaStream';

    return (
      <div className="relative h-[70vh] w-full" data-testid="hero-section">
        <div className="absolute inset-0">
          <img src={backdropUrl} alt={heroTitle.title || heroTitle.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F14] via-[#0B0F14]/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F14] via-transparent to-transparent"></div>
        </div>

        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-end pb-20">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold text-[#E6EEF3]" data-testid="hero-title">
              {heroTitle.title || heroTitle.name}
            </h1>
            <p className="text-lg text-[#96A0AA] line-clamp-3">
              {heroTitle.overview}
            </p>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => handleTitleClick(heroTitle)}
                className="bg-gradient-to-r from-[#00E5FF] to-[#9B7BFF] hover:opacity-90 text-white font-semibold px-8 py-6 rounded-xl"
                data-testid="hero-play-btn"
              >
                <Play className="mr-2" /> Play Trailer
              </Button>
              <Button
                onClick={() => handleTitleClick(heroTitle)}
                variant="outline"
                className="border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-8 py-6 rounded-xl"
                data-testid="hero-info-btn"
              >
                <Info className="mr-2" /> More Info
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSection = (title, items, testId) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="mb-12" data-testid={testId}>
        <h2 className="text-2xl font-bold text-[#E6EEF3] mb-6 px-4 sm:px-6 lg:px-8">{title}</h2>
        <div className="overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 pb-4">
            {items.slice(0, 20).map((item) => (
              <div key={item.id} className="flex-none w-48">
                <TitleCard title={item} onClick={() => handleTitleClick(item)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0F14]" data-testid="browse-page">
      <Navbar onSearch={handleSearch} />

      <div className="pt-16">
        {renderHero()}

        <div className="max-w-7xl mx-auto py-8">
          {searchResults.length > 0 && renderSection('Search Results', searchResults, 'search-results')}
          {searchResults.length === 0 && (
            <>
              {renderSection('Trending Now', trending, 'trending-section')}
              {renderSection('Popular Movies', popularMovies, 'popular-movies-section')}
              {renderSection('Popular TV Shows', popularTV, 'popular-tv-section')}
            </>
          )}
        </div>
      </div>

      {/* Title Details Dialog */}
      <Dialog open={!!selectedTitle} onOpenChange={() => { setSelectedTitle(null); setTitleDetails(null); }}>
        <DialogContent className="bg-[#1a1f2e] border-white/10 text-[#E6EEF3] max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="title-details-dialog">
          {titleDetails && (
            <div className="space-y-6">
              <div className="relative h-64 rounded-xl overflow-hidden">
                <img
                  src={titleDetails.backdrop_path ? `${IMAGE_BASE}/w1280${titleDetails.backdrop_path}` : 'https://via.placeholder.com/1280x720/0B0F14/00E5FF'}
                  alt={titleDetails.title || titleDetails.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1f2e] to-transparent"></div>
              </div>

              <div className="space-y-4">
                <h2 className="text-4xl font-bold" data-testid="dialog-title">{titleDetails.title || titleDetails.name}</h2>
                
                <div className="flex items-center space-x-4 text-sm text-[#96A0AA]">
                  <span>{titleDetails.release_date?.split('-')[0] || titleDetails.first_air_date?.split('-')[0]}</span>
                  <span className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-[#00E5FF] fill-[#00E5FF]" />
                    <span>{titleDetails.vote_average?.toFixed(1)}</span>
                  </span>
                  {titleDetails.runtime && <span>{titleDetails.runtime} min</span>}
                </div>

                <p className="text-[#E6EEF3] leading-relaxed">{titleDetails.overview}</p>

                {titleDetails.genres && (
                  <div className="flex flex-wrap gap-2">
                    {titleDetails.genres.map((genre) => (
                      <span key={genre.id} className="px-3 py-1 bg-white/10 rounded-full text-sm">
                        {genre.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={() => handlePlay(selectedTitle)}
                    className="bg-gradient-to-r from-[#00E5FF] to-[#9B7BFF] hover:opacity-90 text-white font-semibold"
                    data-testid="dialog-play-btn"
                  >
                    <Play className="mr-2 w-5 h-5" /> Play Trailer
                  </Button>
                  <Button
                    onClick={handleAddToWatchlist}
                    variant="outline"
                    className="border-white/20 bg-white/10 hover:bg-white/20 text-white"
                    data-testid="dialog-add-watchlist-btn"
                  >
                    <Plus className="mr-2 w-5 h-5" /> Add to Watchlist
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Video Player */}
      {showPlayer && (
        <div className="fixed inset-0 z-50 bg-black" data-testid="video-player-container">
          <button
            onClick={() => { setShowPlayer(false); setVideoUrl(''); }}
            className="absolute top-4 right-4 z-10 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white rounded-full p-3 transition-colors"
            data-testid="close-video-btn"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <iframe
            src={videoUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            data-testid="video-iframe"
          ></iframe>
        </div>
      )}
    </div>
  );
};

export default Browse;
