"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, ArrowUp, ArrowDown, FolderPlus, Image, FileText, Upload,
  X, Check, Loader2, Sparkles, AlertCircle, Edit, Star, RefreshCw, ChevronRight
} from 'lucide-react';

export default function GalleryCMS() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [albums, setAlbums] = useState<string[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState('All');
  const [loading, setLoading] = useState(true);
  
  // New Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadAlbum, setUploadAlbum] = useState('General');
  const [uploadAltText, setUploadAltText] = useState('');
  const [uploadIsFeatured, setUploadIsFeatured] = useState(false);
  const [uploadMenuCategory, setUploadMenuCategory] = useState('');
  const [uploadMenuDish, setUploadMenuDish] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // New Album state
  const [newAlbumName, setNewAlbumName] = useState('');
  const [showAddAlbum, setShowAddAlbum] = useState(false);

  // Detail / Edit modal
  const [editingPhoto, setEditingPhoto] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAltText, setEditAltText] = useState('');
  const [editAlbum, setEditAlbum] = useState('');
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  const [editMenuCategory, setEditMenuCategory] = useState('');
  const [editMenuDish, setEditMenuDish] = useState('');

  // Replacement file state
  const [replaceFile, setReplaceFile] = useState<File | null>(null);

  useEffect(() => {
    loadGalleryData();
  }, []);

  async function loadGalleryData() {
    setLoading(true);
    try {
      const res = await fetch('/api/cms/gallery');
      const data = await res.json();
      if (data.success) {
        setPhotos(data.photos || []);
        // Safely extract and filter albums
        const uniqueFetchedAlbums = Array.isArray(data.albums) ? data.albums : [];
        setAlbums(['All', ...uniqueFetchedAlbums]);
      }
    } catch (e) {
      console.error('Failed to fetch gallery photos:', e);
    } finally {
      setLoading(false);
    }
  }

  // 1. TARGET ALBUM DROPDOWN OPTIONS LIST
  // Ensures 'General' is always present and selected by default even if albums is empty
  const albumOptions = useMemo(() => {
    const list = albums.filter(a => a !== 'All' && a !== 'General');
    return ['General', ...list];
  }, [albums]);

  // 2. DUPLICATE RENDER PROTECTION
  // Filters out duplicate rows by photo.id and enforces unique keys in the React tree
  const uniquePhotos = useMemo(() => {
    const seen = new Set();
    return photos.filter(p => {
      if (!p.id) return false;
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [photos]);

  const filteredPhotos = useMemo(() => {
    return selectedAlbum === 'All'
      ? uniquePhotos
      : uniquePhotos.filter(p => p.albumName === selectedAlbum);
  }, [uniquePhotos, selectedAlbum]);

  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    setVisibleCount(12);
  }, [selectedAlbum]);

  const displayedPhotos = useMemo(() => {
    return filteredPhotos.slice(0, visibleCount);
  }, [filteredPhotos, visibleCount]);

  // Handle image upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    try {
      // 1. Upload media buffer to `/api/cms/media`
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('folder', 'gallery');

      const mediaRes = await fetch('/api/cms/media', {
        method: 'POST',
        body: formData
      });
      const mediaData = await mediaRes.json();
      
      if (!mediaData.success) {
        alert(mediaData.error || 'Failed to upload media');
        setIsUploading(false);
        return;
      }

      // 2. Save metadata to database via `/api/cms/gallery` POST
      const dbRes = await fetch('/api/cms/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: uploadTitle || uploadFile.name.split('.')[0],
          altText: uploadAltText || uploadTitle || 'Balaji Chilkur Dining Photo',
          src: mediaData.url,
          albumName: uploadAlbum,
          isFeatured: uploadIsFeatured,
          menuCategory: uploadMenuCategory || null,
          menuDishName: uploadMenuDish || null
        })
      });
      const dbData = await dbRes.json();
      if (dbData.success) {
        // Reset fields
        setUploadFile(null);
        setUploadTitle('');
        setUploadAltText('');
        setUploadIsFeatured(false);
        setUploadMenuCategory('');
        setUploadMenuDish('');
        loadGalleryData();
      } else {
        alert(dbData.error);
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading files');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle quick attributes toggling (featured star)
  const handleToggleFeatured = async (photo: any) => {
    try {
      const res = await fetch('/api/cms/gallery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: photo.id,
          data: {
            title: photo.title,
            altText: photo.altText,
            albumName: photo.albumName,
            isFeatured: !photo.isFeatured
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        loadGalleryData();
      } else {
        alert(data.error || 'Failed to update feature status');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Edit Metadata / Replace Image
  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto) return;

    try {
      let finalSrc = editingPhoto.src;

      // 1. If replacement image is selected, upload it and overwrite/preserve the same filename
      if (replaceFile) {
        const formData = new FormData();
        formData.append('file', replaceFile);
        formData.append('folder', 'gallery');
        formData.append('replaceUrl', editingPhoto.src); // Tell API to replace existing file

        const mediaRes = await fetch('/api/cms/media', {
          method: 'POST',
          body: formData
        });
        const mediaData = await mediaRes.json();
        if (mediaData.success) {
          finalSrc = mediaData.url;
        } else {
          alert('Failed to replace file buffer: ' + mediaData.error);
          return;
        }
      }

      // 2. Put metadata updates nested inside 'data' key to align with API
      const res = await fetch('/api/cms/gallery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPhoto.id,
          data: {
            title: editTitle,
            altText: editAltText,
            albumName: editAlbum,
            isFeatured: editIsFeatured,
            src: finalSrc,
            menuCategory: editMenuCategory || null,
            menuDishName: editMenuDish || null
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        setEditingPhoto(null);
        setReplaceFile(null);
        loadGalleryData();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reorder photo (index swaps)
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const list = [...filteredPhotos];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    // Swap elements
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    // Build reorder items payload structured specifically as [{id, order}]
    const payload = list.map((p, idx) => ({
      id: p.id,
      order: idx + 1
    }));

    try {
      const res = await fetch('/api/cms/gallery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulk: true,
          items: payload
        })
      });
      const data = await res.json();
      if (data.success) {
        loadGalleryData();
      } else {
        alert(data.error || 'Failed to reorder items');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle photo deletion
  const handleDeletePhoto = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image? This will permanently remove it.')) return;
    try {
      const res = await fetch(`/api/cms/gallery?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadGalleryData();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNewAlbum = () => {
    if (!newAlbumName.trim()) return;
    const cleanedAlbumName = newAlbumName.trim();
    if (!albums.includes(cleanedAlbumName)) {
      setAlbums([...albums, cleanedAlbumName]);
      setUploadAlbum(cleanedAlbumName);
    }
    setNewAlbumName('');
    setShowAddAlbum(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn font-sans">
      {/* Header Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <Sparkles size={12} className="text-zinc-400" />
            Media & Gallery Library
          </span>
          <h1 className="font-display text-2xl font-black text-zinc-800 mt-2">
            Gallery Management
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Organize albums, customize layout order, assign tags, feature favorites on home page, and upload WebP images.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Sidebar: Albums/Folders (Clean, desaturated border list) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-2">
              <span>Albums</span>
              <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full border border-zinc-200">
                {albums.length - 1}
              </span>
            </h2>
            <button
              onClick={() => setShowAddAlbum(!showAddAlbum)}
              className="p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-all"
              title="Add New Album"
            >
              <FolderPlus size={16} />
            </button>
          </div>

          {showAddAlbum && (
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm space-y-3 animate-slideDown">
              <input
                type="text"
                placeholder="Album name..."
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-zinc-400 text-zinc-800"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAddAlbum(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 text-[10px] font-bold uppercase text-zinc-500 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNewAlbum}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 text-white text-[10px] font-bold uppercase shadow-sm hover:bg-zinc-900"
                >
                  Create
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-4 border border-zinc-200 space-y-1 shadow-sm">
            {albums.map((album) => (
              <button
                key={album}
                onClick={() => setSelectedAlbum(album)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all ${
                  selectedAlbum === album
                    ? 'bg-zinc-800 text-white font-bold'
                    : 'text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <span>{album}</span>
                <ChevronRight size={12} />
              </button>
            ))}
          </div>
        </div>

        {/* Center/Right Area: Upload File & Grid List */}
        <div className="lg:col-span-9 space-y-8">
          
          {/* Upload Panel (Safer desaturated matte grays and zinc styling) */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
            <h3 className="font-display font-bold text-sm text-zinc-800 mb-4 flex items-center gap-2">
              <Upload size={16} className="text-zinc-500" />
              <span>Upload New Photo</span>
            </h3>

            <form onSubmit={handleUploadSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {/* File input (Desaturated gray border box) */}
                <div className="border border-dashed border-zinc-300 hover:border-zinc-500 rounded-xl p-6 text-center transition-all cursor-pointer relative bg-zinc-50/50">
                  {uploadFile ? (
                    <div className="space-y-2 flex flex-col items-center">
                      <Image className="text-zinc-500" size={32} />
                      <span className="text-xs font-bold text-zinc-700 truncate max-w-[200px]">
                        {uploadFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setUploadFile(null)}
                        className="text-[10px] text-red-500 underline font-semibold hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="mx-auto text-zinc-400" size={32} />
                      <span className="block text-xs font-bold text-zinc-600">
                        Drag and drop image file here
                      </span>
                      <span className="block text-[10px] text-zinc-400">
                        Supported formats: JPG, PNG, WEBP. Auto-compresses.
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        required
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Photo Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Paneer Tikka Platter"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-zinc-400 text-zinc-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Target Album</label>
                    <select
                      value={uploadAlbum}
                      onChange={(e) => setUploadAlbum(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none text-zinc-800"
                    >
                      {albumOptions.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">SEO Alt Text (Best practices for search optimization)</label>
                  <input
                    type="text"
                    placeholder="e.g. delicious paneer tikka starters served at Balaji Chilkur Family Dhaba"
                    value={uploadAltText}
                    onChange={(e) => setUploadAltText(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-zinc-400 text-zinc-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Link Category (Menu Jump)</label>
                    <input
                      type="text"
                      placeholder="e.g. Paneer Starters"
                      value={uploadMenuCategory}
                      onChange={(e) => setUploadMenuCategory(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-zinc-400 text-zinc-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Link Dish (Menu Jump)</label>
                    <input
                      type="text"
                      placeholder="e.g. Paneer Butter Masala"
                      value={uploadMenuDish}
                      onChange={(e) => setUploadMenuDish(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-zinc-400 text-zinc-800"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={uploadIsFeatured}
                      onChange={(e) => setUploadIsFeatured(e.target.checked)}
                      className="rounded text-zinc-800 focus:ring-zinc-800"
                    />
                    <span>Highlight/Feature on Homepage Gallery</span>
                  </label>

                  <button
                    type="submit"
                    disabled={isUploading || !uploadFile}
                    className="bg-zinc-800 hover:bg-zinc-900 text-white font-bold uppercase tracking-wider text-[10px] px-5 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={10} className="animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <span>Upload Photo</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Photo List Grid */}
          <div className="space-y-4">
            <h3 className="font-display font-bold text-sm text-zinc-700 px-1 flex items-center justify-between">
              <span>Gallery Grid ({filteredPhotos.length} Items)</span>
            </h3>

            {filteredPhotos.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 border border-zinc-200 text-center flex flex-col items-center">
                <AlertCircle className="text-zinc-400 mb-4" size={48} />
                <h3 className="font-display text-base font-bold text-zinc-700">No Photos Found</h3>
                <p className="text-xs text-zinc-500 mt-1">Upload a photo to populate this album.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedPhotos.map((photo, index) => (
                  <div 
                    key={photo.id} 
                    className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between group"
                  >
                    <div className="relative aspect-square bg-zinc-950">
                      <img src={photo.src} alt={photo.altText || photo.title} loading="lazy" className="w-full h-full object-cover" />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-5">
                        <div className="w-full flex justify-between items-end">
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                              {photo.albumName}
                            </span>
                            <h4 className="font-display font-bold text-white text-sm leading-tight mt-0.5">
                              {photo.title}
                            </h4>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleToggleFeatured(photo)}
                              className={`p-1.5 rounded-lg backdrop-blur-md transition-colors ${
                                photo.isFeatured 
                                  ? 'bg-zinc-100 text-zinc-800' 
                                  : 'bg-black/55 text-zinc-400 hover:bg-black/75'
                              }`}
                              title="Feature on Home Page"
                            >
                              <Star size={12} fill={photo.isFeatured ? "currentColor" : "none"} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingPhoto(photo);
                                setEditTitle(photo.title);
                                setEditAltText(photo.altText || '');
                                setEditAlbum(photo.albumName);
                                setEditIsFeatured(photo.isFeatured);
                                setEditMenuCategory(photo.menuCategory || '');
                                setEditMenuDish(photo.menuDishName || '');
                              }}
                              className="p-1.5 rounded-lg bg-black/55 text-zinc-200 hover:bg-black/75 backdrop-blur-md transition-colors"
                              title="Edit Metadata & File"
                            >
                              <Edit size={12} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Display Order Position indicator */}
                      <span className="absolute top-4 left-4 bg-black/60 text-zinc-300 text-[9px] font-mono font-bold px-2 py-0.5 rounded backdrop-blur-sm">
                        Order #{photo.displayOrder || index + 1}
                      </span>
                    </div>

                    {/* Bottom Order Sorter Bar & Delete */}
                    <div className="px-5 py-2.5 bg-zinc-50 border-t border-zinc-200 flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMove(index, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-zinc-200 rounded text-zinc-600 disabled:opacity-30"
                          title="Move Order Up"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          onClick={() => handleMove(index, 'down')}
                          disabled={index === filteredPhotos.length - 1}
                          className="p-1 hover:bg-zinc-200 rounded text-zinc-600 disabled:opacity-30"
                          title="Move Order Down"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>

                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="p-1.5 hover:text-red-500 hover:bg-red-50 rounded transition-colors text-zinc-400"
                        title="Delete Image"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {visibleCount < filteredPhotos.length && (
              <div className="flex justify-center pt-6">
                <button
                  type="button"
                  onClick={() => setVisibleCount(prev => prev + 12)}
                  className="px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-900 text-white font-display font-extrabold uppercase tracking-wider text-[10px] shadow-sm transition-all border border-zinc-700"
                >
                  Load More Images
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Edit Metadata & Replace Image Modal --- */}
      {editingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <form onSubmit={handleSaveMetadata} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-zinc-250 space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="font-display font-black text-lg text-zinc-800">
                Edit Image Details
              </h3>
              <button type="button" onClick={() => { setEditingPhoto(null); setReplaceFile(null); }} className="p-1 text-zinc-400 hover:text-zinc-700">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4 items-center bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                <img src={editingPhoto.src} alt={editingPhoto.title} className="w-20 h-20 object-cover rounded-lg border border-zinc-200 shadow-sm" />
                
                <div className="space-y-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">Replace Image File</span>
                  
                  <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-900 text-white px-3 py-2 rounded-xl font-bold uppercase text-[9px] tracking-wider flex items-center gap-1.5 shadow-sm border border-zinc-700">
                    <RefreshCw size={10} />
                    {replaceFile ? 'Replace selected' : 'Upload New File'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setReplaceFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                  {replaceFile && (
                    <span className="text-[9px] text-zinc-600 font-bold truncate max-w-[150px] block">
                      Selected: {replaceFile.name}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Photo Title *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-zinc-400 text-zinc-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Target Album *</label>
                <select
                  value={editAlbum}
                  onChange={(e) => setEditAlbum(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none text-zinc-800"
                >
                  {albumOptions.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">SEO Alt Text</label>
                <input
                  type="text"
                  value={editAltText}
                  onChange={(e) => setEditAltText(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-zinc-400 text-zinc-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Link Category (Menu Jump)</label>
                  <input
                    type="text"
                    value={editMenuCategory}
                    onChange={(e) => setEditMenuCategory(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-zinc-400 text-zinc-800"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Link Dish (Menu Jump)</label>
                  <input
                    type="text"
                    value={editMenuDish}
                    onChange={(e) => setEditMenuDish(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-zinc-400 text-zinc-800"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsFeatured}
                    onChange={(e) => setEditIsFeatured(e.target.checked)}
                    className="rounded text-zinc-800 focus:ring-zinc-800"
                  />
                  <span>Feature on Homepage Gallery Slider</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => { setEditingPhoto(null); setReplaceFile(null); }}
                className="px-4 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-600 text-xs font-bold uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-900 text-white text-xs font-bold uppercase tracking-wider shadow-sm border border-zinc-750"
              >
                Save Details
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
