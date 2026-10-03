/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  TEXTURE_SLOT_SPECS, 
  TextureSlot, 
  setCustomTexture, 
  removeCustomTexture, 
  getCustomTextureUrl 
} from '../game/textures';
import { Upload, RefreshCw, Image as ImageIcon, CheckCircle, Info, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const TextureGraphicsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [selectedSlot, setSelectedSlot] = useState<TextureSlot>('soldier_face');
  const [urlInput, setUrlInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentSpec = TEXTURE_SLOT_SPECS[selectedSlot];
  const customUrl = getCustomTextureUrl(selectedSlot);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCustomTexture(selectedSlot, dataUrl);
        setStatusMessage(`Custom texture applied to ${currentSpec.name}!`);
        setTimeout(() => setStatusMessage(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    setCustomTexture(selectedSlot, urlInput.trim());
    setStatusMessage(`Remote texture loaded for ${currentSpec.name}!`);
    setUrlInput('');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleResetSlot = () => {
    removeCustomTexture(selectedSlot);
    setStatusMessage(`Reset ${currentSpec.name} to default procedural graphics.`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-wide font-['Chakra_Petch'] uppercase text-neutral-100">
                Graphics & Custom Texture Engine
              </h2>
              <p className="text-xs text-neutral-400">
                Provide custom graphics, doodle faces, camo wraps, or sprites to inject directly into Three.js
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-neutral-600 text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-neutral-800">
          {/* Left Column: Texture Slots List */}
          <div className="md:col-span-5 p-4 space-y-1.5 bg-neutral-950/40 overflow-y-auto max-h-[60vh] md:max-h-[70vh]">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-2">
              Available Texture Slots
            </span>
            {Object.values(TEXTURE_SLOT_SPECS).map((spec) => {
              const isSelected = selectedSlot === spec.slot;
              const hasCustom = !!getCustomTextureUrl(spec.slot);

              return (
                <button
                  key={spec.slot}
                  onClick={() => setSelectedSlot(spec.slot)}
                  className={`w-full text-left p-3 rounded-lg flex items-center justify-between border transition-all ${
                    isSelected
                      ? 'bg-neutral-800 border-emerald-500/80 text-white shadow-md'
                      : 'bg-neutral-900/60 border-neutral-800/80 text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded ${hasCustom ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-400'}`}>
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold leading-tight">{spec.name}</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">{spec.recommendedResolution}</div>
                    </div>
                  </div>
                  {hasCustom ? (
                    <span className="text-[11px] text-emerald-400 font-medium">Custom</span>
                  ) : (
                    <span className="text-[11px] text-neutral-500 font-normal">Procedural</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Column: Slot Detail & Customizer */}
          <div className="md:col-span-7 p-6 space-y-5 bg-neutral-900">
            {statusMessage && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-lg text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-neutral-100 font-['Chakra_Petch']">
                  {currentSpec.name}
                </h3>
                <span className="text-xs text-neutral-400">
                  Slot: <code className="text-emerald-400 font-mono">{currentSpec.slot}</code>
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                {currentSpec.description}
              </p>
            </div>

            {/* Spec Card */}
            <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">Recommended Resolution:</span>
                <span className="font-semibold text-neutral-200">{currentSpec.recommendedResolution}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">Active Pipeline:</span>
                <span className={`font-semibold ${customUrl ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {customUrl ? 'User Custom Image Texture' : 'Built-in Procedural Canvas Shader'}
                </span>
              </div>
              {customUrl && (
                <div className="pt-2 border-t border-neutral-800">
                  <div className="text-[11px] text-neutral-400 mb-1.5">Active Texture Preview:</div>
                  <img 
                    src={customUrl} 
                    alt={currentSpec.name} 
                    className="w-24 h-24 object-cover rounded-md border border-neutral-700 bg-neutral-800"
                  />
                </div>
              )}
            </div>

            {/* Provide Texture Section */}
            <div className="space-y-4">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300 block">
                Provide Graphic / Texture
              </label>

              {/* Method A: Upload Image */}
              <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-dashed border-neutral-700 bg-neutral-950/60 hover:border-emerald-500/60 hover:bg-neutral-950 transition-colors text-xs font-medium text-neutral-300">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Upload Local File (PNG / JPG / SVG)</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Method B: URL */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Or paste public image URL..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleApplyUrl}
                  disabled={!urlInput.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                <Info className="w-3.5 h-3.5" />
                <span>Textures render in 3D Three.js immediately.</span>
              </div>
              {customUrl && (
                <button
                  onClick={handleResetSlot}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-amber-400 hover:text-amber-300 bg-amber-950/30 border border-amber-500/30 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset to Default Procedural</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
