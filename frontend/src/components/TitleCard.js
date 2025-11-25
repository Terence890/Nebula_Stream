import React from 'react';
import { Play, Plus, Info } from 'lucide-react';

const IMAGE_BASE = 'https://image.tmdb.org/t/p';

const TitleCard = ({ title, onClick }) => {
  const imageUrl = title.poster_path
    ? `${IMAGE_BASE}/w500${title.poster_path}`
    : title.backdrop_path
    ? `${IMAGE_BASE}/w500${title.backdrop_path}`
    : 'https://via.placeholder.com/500x750/0B0F14/00E5FF?text=No+Image';

  const name = title.title || title.name || 'Untitled';
  const year = title.release_date ? title.release_date.split('-')[0] : title.first_air_date ? title.first_air_date.split('-')[0] : 'N/A';
  const rating = title.vote_average ? title.vote_average.toFixed(1) : 'N/A';

  return (
    <div
      className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10"
      onClick={onClick}
      data-testid={`title-card-${title.id}`}
    >
      <div className="aspect-[2/3] relative">
        <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
            <h3 className="text-white font-semibold text-lg line-clamp-1">{name}</h3>
            <div className="flex items-center space-x-3 text-sm text-[#96A0AA]">
              <span>{year}</span>
              <span className="flex items-center space-x-1">
                <span className="text-[#00E5FF]">{rating}</span>
              </span>
            </div>
            <div className="flex space-x-2 pt-2">
              <button className="flex-1 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-lg px-3 py-2 flex items-center justify-center space-x-2 transition-colors" data-testid={`play-btn-${title.id}`}>
                <Play className="w-4 h-4" />
                <span className="text-sm">Play</span>
              </button>
              <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-lg px-3 py-2 transition-colors" data-testid={`add-btn-${title.id}`}>
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TitleCard;
