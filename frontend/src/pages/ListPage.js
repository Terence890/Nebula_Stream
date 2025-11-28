import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import TitleCard from '../components/TitleCard';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent } from '../components/ui/dialog';
import { Play, Plus, Info, Star } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND = process.env.REACT_APP_BACKEND_URL ? process.env.REACT_APP_BACKEND_URL.replace(/\/+$/,'') : '';
const API = `${BACKEND}/api`;

const IMAGE_BASE = 'https://image.tmdb.org/t/p';
const titleForCategory = (cat) => {
  switch (cat) {
    case 'movie':
      return 'All Movies';
    case 'tv':
      return 'All TV Shows';
    case 'trending':
      return 'Trending';
    default:
      return 'Results';
  }
};

const ListPage = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);
  // Player state (allow playing trailers directly from the list)
  const [titleDetails, setTitleDetails] = useState(null);
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [externalVideoUrl, setExternalVideoUrl] = useState('');
  const [isYouTubePlayer, setIsYouTubePlayer] = useState(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState('');
  const playerRef = useRef(null);
  const ytPlayerRef = useRef(null);

  useEffect(() => {
    // reset when category changes
    setItems([]);
    setPage(1);
    setHasMore(true);
  }, [category]);

  useEffect(() => {
    fetchPage(page);
  }, [page, category]);

  const fetchPage = async (p = 1) => {
    if (loading) return;
    setLoading(true);
    try {
      let url = '';
      if (category === 'trending') {
        url = `${API}/titles/trending?page=${p}`;
      } else if (category === 'movie' || category === 'tv') {
        url = `${API}/titles/popular?media_type=${category}&page=${p}`;
      } else {
        // fallback to search by category name
        url = `${API}/titles/search?query=${encodeURIComponent(category)}&page=${p}`;
      }

      const res = await axios.get(url);
      const results = res.data?.results || [];

      setItems((prev) => {
        if (p === 1) return results || [];
        // dedupe by id when appending pages
        const existingIds = new Set(prev.map((it) => it.id));
        const filtered = (results || []).filter((r) => !existingIds.has(r.id));
        return [...prev, ...filtered];
      });
      setTotalPages(res.data?.total_pages || 1);

      // determine if there's more to load
      if (res.data && typeof res.data.page === 'number' && typeof res.data.total_pages === 'number') {
        setHasMore(res.data.page < res.data.total_pages);
      } else {
        // fallback: if we received less than the typical page size, assume end
        setHasMore(results.length > 0);
      }
    } catch (err) {
      console.error('Failed to fetch list', err);
      toast.error('Failed to load list');
    } finally {
      setLoading(false);
    }
  };

  // IntersectionObserver to implement infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && hasMore && !loading) {
          setPage((p) => p + 1);
        }
      });
    }, { root: null, rootMargin: '200px', threshold: 0.1 });

    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasMore, loading]);

  // Play a title: fetch details then mount player (similar to Browse.js behavior)
  const playTitle = async (title) => {
    const mediaType = title.media_type || (title.title ? 'movie' : 'tv');
    try {
      const res = await axios.get(`${API}/titles/${mediaType}/${title.id}`);
      const details = res.data;
      setTitleDetails(details);

      const videos = details?.videos?.results || [];
      const trailers = videos.filter(v => v.type === 'Trailer');
      const teasers = videos.filter(v => v.type === 'Teaser');
      const candidate = (trailers.length ? trailers[0] : teasers.length ? teasers[0] : null);

      if (candidate) {
        const key = candidate.key;
        if (candidate.site === 'YouTube' || candidate.site === 'youtube') {
          setYoutubeVideoId(key);
          setIsYouTubePlayer(true);
          setExternalVideoUrl(`https://www.youtube.com/watch?v=${key}`);
          setVideoUrl('');
        } else {
          setIsYouTubePlayer(false);
          setVideoUrl(candidate.url || '');
          setExternalVideoUrl(candidate.url || '');
        }

        // show the player overlay; close any drawers by scrolling to top first
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setShowPlayer(true), 0);
      } else {
        toast.info('No trailer available for this title.');
      }
    } catch (err) {
      console.error('Failed to fetch details for play', err);
      toast.error('Failed to play trailer');
    }
  };

  const handleTitleClick = async (title) => {
    setSelectedTitle(title);
    const mediaType = title.media_type || (title.title ? 'movie' : 'tv');
    try {
      const response = await axios.get(`${API}/titles/${mediaType}/${title.id}`);
      setTitleDetails(response.data);
    } catch (err) {
      console.error('Failed to fetch title details', err);
      toast.error('Failed to load details');
    }
  };

  const handlePlay = () => {
    // Use already-fetched titleDetails to locate a trailer and show player
    const details = titleDetails;
    const videos = details?.videos?.results || [];
    const trailers = videos.filter(v => v.type === 'Trailer');
    const teasers = videos.filter(v => v.type === 'Teaser');
    const candidate = (trailers.length ? trailers[0] : teasers.length ? teasers[0] : null);

    if (candidate) {
      const key = candidate.key;
      if (candidate.site === 'YouTube' || candidate.site === 'youtube') {
        setYoutubeVideoId(key);
        setIsYouTubePlayer(true);
        setExternalVideoUrl(`https://www.youtube.com/watch?v=${key}`);
        setVideoUrl('');
      } else {
        setIsYouTubePlayer(false);
        setVideoUrl(candidate.url || '');
        setExternalVideoUrl(candidate.url || '');
      }

      // Close the details dialog before showing the player
      setSelectedTitle(null);
      setTitleDetails(null);
      setTimeout(() => setShowPlayer(true), 0);
    } else {
      toast.info('No trailer available for this title.');
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

  // mount/destroy YouTube IFrame player when needed
  useEffect(() => {
    const loadYouTubeApi = () => {
      return new Promise((resolve) => {
        if (window.YT && window.YT.Player) return resolve(window.YT);
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
          resolve(window.YT);
        };
      });
    };

    const mountPlayer = async () => {
      if (!isYouTubePlayer || !youtubeVideoId || !showPlayer) return;
      try {
        const YT = await loadYouTubeApi();
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
              const code = e.data;
              if (code === 101 || code === 150) {
                toast.error('This video cannot be embedded. Opening on YouTube.');
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
      if (ytPlayerRef.current && ytPlayerRef.current.destroy) {
        try { ytPlayerRef.current.destroy(); } catch (e) { /* ignore */ }
        ytPlayerRef.current = null;
      }
    };
  }, [showPlayer, isYouTubePlayer, youtubeVideoId]);

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <Navbar />
      <div className="max-w-7xl mx-auto pt-16 sm:pt-20 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-red-600">{titleForCategory(category)}</h1>
          <div className="flex items-center space-x-3">
            <Button onClick={() => navigate(-1)} variant="ghost" className="text-red-500">Back</Button>
            <span className="text-sm text-red-400 hidden sm:inline">Page {page} / {totalPages}</span>
            {loading ? (
              <span className="text-sm text-red-400">Loading...</span>
            ) : (
              <span className="text-sm text-red-400 sm:hidden">Page {page}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((it) => (
            <div key={it.id} className="w-full">
              <TitleCard title={it} onClick={() => handleTitleClick(it)} onPlay={() => playTitle(it)} />
            </div>
          ))}
        </div>

        {items.length === 0 && !loading && (
          <div className="text-red-400 mt-8">No items found.</div>
        )}

        {/* sentinel for infinite scroll */}
        <div ref={sentinelRef} className="w-full h-8" />

        {/* loading indicator */}
        {loading && (
          <div className="flex items-center justify-center py-6">
            <div className="text-red-400">Loading more...</div>
          </div>
        )}
      </div>

      {/* Video Player Overlay */}
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
      {/* Title Details Dialog */}
      <Dialog
        open={!!selectedTitle}
        onOpenChange={(isOpen) => {
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
                    onClick={handlePlay}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                    data-testid="dialog-play-btn"
                  >
                    <Play className="mr-2 w-5 h-5" /> Play Trailer
                  </Button>
                  <Button
                    onClick={() => { /* simple add placeholder: watchlist uses profile in Browse */ }}
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
    </div>
  );
};

export default ListPage;
