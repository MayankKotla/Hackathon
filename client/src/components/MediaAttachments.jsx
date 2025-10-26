import React, { useState, useEffect } from 'react';
import { Play, Image as ImageIcon, Video, Loader2 } from 'lucide-react';

const MediaAttachments = ({ recipeId }) => {
  const [mediaAttachments, setMediaAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    const fetchMedia = async () => {
      if (!recipeId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/media/recipe/${recipeId}`);
        if (response.ok) {
          const data = await response.json();
          setMediaAttachments(data.media || []);
        }
      } catch (error) {
        console.error('Error fetching media attachments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [recipeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading media...</span>
      </div>
    );
  }

  if (mediaAttachments.length === 0) {
    return null;
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-gray-900 flex items-center">
        <ImageIcon className="w-5 h-5 mr-2" />
        Photos & Videos
      </h4>
      
      {/* Media Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mediaAttachments.map((media) => (
          <div
            key={media.id}
            className="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-100"
            onClick={() => setSelectedMedia(media)}
          >
            {media.media_type === 'image' ? (
              <div className="aspect-video">
                <img
                  src={media.supabase_url}
                  alt={media.file_name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="aspect-video relative">
                <video
                  src={media.supabase_url}
                  className="w-full h-full object-cover"
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                  <Play className="w-8 h-8 text-white" />
                </div>
                {media.duration && (
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(media.duration)}
                  </div>
                )}
              </div>
            )}
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {media.media_type === 'video' ? (
                  <Video className="w-6 h-6 text-white" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-white" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Media Modal */}
      {selectedMedia && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <div className="max-w-4xl max-h-[90vh] w-full">
            <div className="relative">
              <button
                onClick={() => setSelectedMedia(null)}
                className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70"
              >
                ✕
              </button>
              
              {selectedMedia.media_type === 'image' ? (
                <img
                  src={selectedMedia.supabase_url}
                  alt={selectedMedia.file_name}
                  className="w-full h-full object-contain max-h-[80vh]"
                />
              ) : (
                <video
                  src={selectedMedia.supabase_url}
                  controls
                  className="w-full h-full object-contain max-h-[80vh]"
                  autoPlay
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaAttachments;
