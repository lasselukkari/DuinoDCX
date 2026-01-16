import {parseDcxPresets} from '../dcx-file.js';
import type {ParsedPreset} from '../dcx-file.js';
import {PAGE_SIZE} from './device-state-buffer.js';

/**
 * PresetBuffer - Binary source of truth for device presets.
 * 
 * Stores raw .dcx file format data (12 pages × 875 bytes each).
 * ParsedPreset[] is derived lazily and cached until buffer changes.
 */
export class PresetBuffer {
  // Raw .dcx format data (source of truth)
  private data: Uint8Array;
  
  // Cached derived presets
  private cachedPresets: ParsedPreset[] | undefined;
  private isDirty = true;

  /**
   * Create buffer from raw .dcx data
   */
  constructor(data: Uint8Array) {
    // Store COPY to prevent external mutation
    this.data = new Uint8Array(data);
  }
  
  /**
   * Factory: Create from individual pages (as received from device)
   */
  static fromPages(pages: Uint8Array[]): PresetBuffer {
    // Calculate total size
    const totalSize = pages.reduce((sum, page) => sum + page.length, 0);
    const combined = new Uint8Array(totalSize);
    
    // Concatenate all pages
    let offset = 0;
    for (const page of pages) {
      combined.set(page, offset);
      offset += page.length;
    }
    
    return new PresetBuffer(combined);
  }
  
  /**
   * Get derived preset list (cached until buffer is modified)
   */
  getPresets(): ParsedPreset[] {
    if (this.isDirty || !this.cachedPresets) {
      this.cachedPresets = parseDcxPresets(this.data);
      this.isDirty = false;
    }
    return this.cachedPresets;
  }
  
  /**
   * Get raw .dcx buffer data
   */
  getData(): Uint8Array {
    return this.data;
  }
  
  /**
   * Get pages for uploading to device (split at PAGE_SIZE boundaries)
   * Returns 12 pages of 875 bytes each
   */
  getPages(): Uint8Array[] {
    const pages: Uint8Array[] = [];
    const pageCount = Math.ceil(this.data.length / PAGE_SIZE);
    
    for (let i = 0; i < pageCount; i++) {
      const start = i * PAGE_SIZE;
      const end = Math.min(start + PAGE_SIZE, this.data.length);
      pages.push(this.data.subarray(start, end));
    }
    
    return pages;
  }
  
  /**
   * Copy Edit Buffer data to a specific preset slot
   * 
   * @param _slotIndex - Preset slot (0-59)
   * @param _editBufferData - Raw 8-bit edit buffer data (1659 bytes)
   * 
   * Note: This requires complex format conversion between Edit Buffer format
   * (XPCR/XPRB headers) and .dcx preset format (XSNP structure). This is not
   * yet implemented as it requires understanding the exact mapping between
   * the two formats.
   * 
   * For now, use the existing RestoreSession to upload modified .dcx files.
   */
  copyFromEditBuffer(_slotIndex: number, _editBufferData: Uint8Array): void {
    throw new Error('copyFromEditBuffer not yet implemented - use RestoreSession for preset uploads');
  }
}
