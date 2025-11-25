import React, { useEffect, useState, useRef } from 'react';
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

const BACKEND = process.env.REACT_APP_BACKEND_URL ? process.env.REACT_APP_BACKEND_URL.replace(/\/+$/,'') : '';
const API = `${BACKEND}/api`;
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
  const [externalVideoUrl, setExternalVideoUrl] = useState('');
  const [isYouTubePlayer, setIsYouTubePlayer] = useState(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState('');
  const playerRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const [heroTitle, setHeroTitle] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);

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

      const trendingList = trendingRes.data?.results || [];
      setTrending(trendingList);
      setPopularMovies(moviesRes.data?.results || []);
      setPopularTV(tvRes.data?.results || []);
      // initialize hero to first trending item
      setHeroIndex(0);
      setHeroTitle(trendingList[0] || null);
    } catch (error) {
      console.error('Failed to fetch titles', error);
      toast.error('Failed to load content');
    }
  };

  // Rotate hero every 20 seconds through the trending list
  useEffect(() => {
    if (!trending || trending.length <= 1) return undefined;
    // ensure heroIndex in bounds
    setHeroIndex((i) => (i >= trending.length ? 0 : i));
    const id = setInterval(() => {
      setHeroIndex((i) => {
        const next = (i + 1) % trending.length;
        setHeroTitle(trending[next]);
        return next;
      });
    }, 20000); // 20 seconds

    return () => clearInterval(id);
  }, [trending]);

  const handleSearch = async (query) => {
    try {
      const response = await axios.get(`${API}/titles/search?query=${query}`);
      setSearchResults(response.data?.results || []);
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
    // Find trailers (prefer 'Trailer', fallback to 'Teaser')
    const videos = titleDetails?.videos?.results || [];
    const trailers = videos.filter(v => v.type === 'Trailer');
    const teasers = videos.filter(v => v.type === 'Teaser');
    const candidate = (trailers.length ? trailers[0] : teasers.length ? teasers[0] : null);

    if (candidate) {
      // Prepare both embed and external watch URLs (YouTube)
      const key = candidate.key;
      if (candidate.site === 'YouTube' || candidate.site === 'youtube') {
        // Use YouTube IFrame API for better error handling (detect embedding blocked errors)
        setYoutubeVideoId(key);
        setIsYouTubePlayer(true);
        setExternalVideoUrl(`https://www.youtube.com/watch?v=${key}`);
        // clear iframe-based URL (we'll mount the player)
        setVideoUrl('');
      } else {
        // For non-YouTube providers use iframe/embed if available, otherwise open external link
        setIsYouTubePlayer(false);
        setVideoUrl(candidate.url || '');
        setExternalVideoUrl(candidate.url || '');
      }
      // Close the details dialog before showing the player so the player can occupy the screen
      setSelectedTitle(null);
      setTitleDetails(null);
      // small tick to ensure dialog state updates, then show player
      setTimeout(() => setShowPlayer(true), 0);
    } else {
      toast.info('No trailer available for this title. TMDb provides trailers/metadata but not full movie streams.');
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

  const closePlayer = () => {
    setShowPlayer(false);
    setVideoUrl('');
    setExternalVideoUrl('');
    setIsYouTubePlayer(false);
    setYoutubeVideoId('');
    if (ytPlayerRef.current && ytPlayerRef.current.destroy) {
      try { ytPlayerRef.current.destroy(); } catch (e) { /* ignore */ }
      ytPlayerRef.current = null;
    }
  };

  // Initialize or destroy YouTube IFrame player when needed
  useEffect(() => {
    const loadYouTubeApi = () => {
      return new Promise((resolve) => {
        if (window.YT && window.YT.Player) return resolve(window.YT);
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        // YouTube API will call this global when ready
        window.onYouTubeIframeAPIReady = () => {
          resolve(window.YT);
        };
      });
    };

    const mountPlayer = async () => {
      if (!isYouTubePlayer || !youtubeVideoId || !showPlayer) return;
      try {
        const YT = await loadYouTubeApi();
        // Destroy existing player if any
        if (ytPlayerRef.current && ytPlayerRef.current.destroy) {
          try { ytPlayerRef.current.destroy(); } catch (e) { /* ignore */ }
          ytPlayerRef.current = null;
        }

        ytPlayerRef.current = new YT.Player(playerRef.current, {
          height: '100%',
          width: '100%',
          videoId: youtubeVideoId,
          playerVars: { autoplay: 1, controls: 1, rel: 0 },
          events: {
            onReady: (event) => {
              try { event.target.playVideo && event.target.playVideo(); } catch (e) { /* ignore */ }
            },
            onError: (e) => {
              // e.data contains the error code: 2,5,100,101,150 etc.
              const code = e.data;
              if (code === 101 || code === 150) {
                toast.error('This video cannot be embedded. Opening on YouTube.');
                // offer external link and keep player UI; user can click "Watch on YouTube"
                setExternalVideoUrl(`https://www.youtube.com/watch?v=${youtubeVideoId}`);
              } else {
                toast.error('Playback error (YouTube). Opening on YouTube.');
                setExternalVideoUrl(`https://www.youtube.com/watch?v=${youtubeVideoId}`);
              }
            }
          }
        });
      } catch (err) {
        console.error('YT player init failed', err);
        setExternalVideoUrl(`https://www.youtube.com/watch?v=${youtubeVideoId}`);
      }
    };

    if (showPlayer && isYouTubePlayer && youtubeVideoId) mountPlayer();

    return () => {
      // cleanup on unmount or when deps change
      if (ytPlayerRef.current && ytPlayerRef.current.destroy) {
        try { ytPlayerRef.current.destroy(); } catch (e) { /* ignore */ }
        ytPlayerRef.current = null;
      }
    };
  }, [showPlayer, isYouTubePlayer, youtubeVideoId]);

  const renderHero = () => {
    if (!heroTitle) return null;
    const backdropUrl = heroTitle.backdrop_path
      ? `${IMAGE_BASE}/original${heroTitle.backdrop_path}`
      : 'https://via.placeholder.com/1920x1080/0B0F14/00E5FF?text=NebulaStream';

    return (
      <div className="relative h-[70vh] w-full" data-testid="hero-section">
          <div className="absolute inset-0">
          <img src={backdropUrl} alt={heroTitle.title || heroTitle.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[#0B0F14]/60"></div>
        </div>

        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-end pb-20">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold text-red-600 neon" data-testid="hero-title">
              {heroTitle.title || heroTitle.name}
            </h1>
            <p className="text-lg text-red-400 line-clamp-3">
              {heroTitle.overview}
            </p>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => handleTitleClick(heroTitle)}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-6 rounded-xl"
                data-testid="hero-play-btn"
              >
                <Play className="mr-2" /> Play Trailer
              </Button>
              <Button
                onClick={() => handleTitleClick(heroTitle)}
                variant="outline"
                className="border-red-600 bg-transparent backdrop-blur-sm hover:bg-red-700/10 text-red-600 px-8 py-6 rounded-xl"
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
        <h2 className="text-2xl font-bold text-red-600 mb-6 px-4 sm:px-6 lg:px-8">{title}</h2>
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
      <Dialog
        open={!!selectedTitle}
        onOpenChange={(isOpen) => {
          // Only clear selection when the dialog is being closed
          if (!isOpen) {
            setSelectedTitle(null);
            setTitleDetails(null);
          }
        }}
      >
        <DialogContent className="backdrop-blur-md bg-black/40 border border-white/5 text-red-600 max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6" data-testid="title-details-dialog">
          {titleDetails && (
            <div className="space-y-6">
              <div className="relative h-64 rounded-xl overflow-hidden">
                <img
                  src={titleDetails.backdrop_path ? `${IMAGE_BASE}/w1280${titleDetails.backdrop_path}` : 'https://via.placeholder.com/1280x720/0B0F14/00E5FF'}
                  alt={titleDetails.title || titleDetails.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-[#1a1f2e]/60"></div>
              </div>

              <div className="space-y-4">
                <h2 className="text-4xl font-bold" data-testid="dialog-title">{titleDetails.title || titleDetails.name}</h2>
                
                <div className="flex items-center space-x-4 text-sm text-red-400">
                  <span>{titleDetails.release_date?.split('-')[0] || titleDetails.first_air_date?.split('-')[0]}</span>
                  <span className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-red-500 fill-red-500" />
                    <span>{titleDetails.vote_average?.toFixed(1)}</span>
                  </span>
                  {titleDetails.runtime && <span>{titleDetails.runtime} min</span>}
                </div>

                <p className="text-red-600 leading-relaxed">{titleDetails.overview}</p>

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
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                    data-testid="dialog-play-btn"
                  >
                    <Play className="mr-2 w-5 h-5" /> Play Trailer
                  </Button>
                  <Button
                    onClick={handleAddToWatchlist}
                    variant="outline"
                    className="border-red-600 bg-transparent hover:bg-red-700/10 text-red-600"
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
            onClick={closePlayer}
            className="absolute top-4 right-4 z-10 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white rounded-full p-3 transition-colors"
            data-testid="close-video-btn"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Top control bar: explain that TMDb provides trailers, and offer external YouTube link as fallback */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-6 z-20 flex items-center space-x-3 bg-black/50 px-3 py-1 rounded-md">
            {externalVideoUrl && (
              <a
                href={externalVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closePlayer}
                className="inline-flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
                data-testid="watch-on-youtube-btn"
              >
                Watch on YouTube
              </a>
            )}
          </div>

          {/* If this is a YouTube player we mount the IFrame API into the player container, otherwise use a regular iframe */}
          {isYouTubePlayer ? (
            <div ref={playerRef} className="w-full h-full" data-testid="youtube-player" />
          ) : (
            <iframe
              src={videoUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              data-testid="video-iframe"
              title="Trailer"
            ></iframe>
          )}
        </div>
      )}
    </div>
  );
};

export default Browse;
