import React, { useState, useRef } from 'react';
import { Upload, X, Play, Image as ImageIcon, Video, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const MediaUpload = ({ onMediaChange, maxFiles = 5, maxVideoDuration = 60 }) => {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    // Check file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      return 'Only image and video files are allowed';
    }

    // Check file size
    const maxSize = file.type.startsWith('video/') ? 200 * 1024 * 1024 : 50 * 1024 * 1024; // 200MB for videos, 50MB for images
    if (file.size > maxSize) {
      return `File size must be less than ${file.type.startsWith('video/') ? '200MB' : '50MB'}`;
    }

    return null;
  };

  const validateVideoDuration = (file) => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('video/')) {
        resolve(null);
        return;
      }

      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > maxVideoDuration) {
          resolve(`Video duration must be ${maxVideoDuration} seconds or less`);
        } else {
          resolve(null);
        }
      };

      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        resolve('Could not validate video duration');
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleFiles = async (files) => {
    const fileArray = Array.from(files);
    
    // Check if adding these files would exceed the limit
    if (mediaFiles.length + fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const validFiles = [];
    const errors = [];

    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
        continue;
      }

      // Validate video duration
      const durationError = await validateVideoDuration(file);
      if (durationError) {
        errors.push(`${file.name}: ${durationError}`);
        continue;
      }

      validFiles.push(file);
    }

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
    }

    if (validFiles.length > 0) {
      const newMediaFiles = validFiles.map(file => ({
        id: Date.now() + Math.random(),
        file,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        name: file.name,
        size: file.size,
        preview: URL.createObjectURL(file)
      }));

      const updatedFiles = [...mediaFiles, ...newMediaFiles];
      setMediaFiles(updatedFiles);
      onMediaChange(updatedFiles);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (id) => {
    const updatedFiles = mediaFiles.filter(file => {
      if (file.id === id) {
        URL.revokeObjectURL(file.preview);
        return false;
      }
      return true;
    });
    setMediaFiles(updatedFiles);
    onMediaChange(updatedFiles);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center space-y-2">
          <Upload className="w-8 h-8 text-gray-400" />
          <div className="text-sm text-gray-600">
            <p className="font-medium">Drop files here or click to upload</p>
            <p className="text-xs text-gray-500 mt-1">
              Images (max 50MB) • Videos (max 200MB, {maxVideoDuration}s)
            </p>
            <p className="text-xs text-gray-500">
              Up to {maxFiles} files
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary text-sm px-4 py-2"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              'Choose Files'
            )}
          </button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Media Preview */}
      {mediaFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Selected Files ({mediaFiles.length}/{maxFiles})
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {mediaFiles.map((media) => (
              <div key={media.id} className="relative group">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  {media.type === 'image' ? (
                    <img
                      src={media.preview}
                      alt={media.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center bg-gray-200">
                      <video
                        src={media.preview}
                        className="w-full h-full object-cover"
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="w-8 h-8 text-white bg-black bg-opacity-50 rounded-full p-2" />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* File Info */}
                <div className="mt-2 text-xs text-gray-600">
                  <div className="flex items-center space-x-1">
                    {media.type === 'image' ? (
                      <ImageIcon className="w-3 h-3" />
                    ) : (
                      <Video className="w-3 h-3" />
                    )}
                    <span className="truncate">{media.name}</span>
                  </div>
                  <div className="text-gray-500">
                    {formatFileSize(media.size)}
                    {media.duration && ` • ${formatDuration(media.duration)}`}
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeFile(media.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaUpload;
