import React, { useMemo } from 'react';
import { FONT_OPTIONS } from '../constants';

/**
 * FontFaceLoader: Generates @font-face declarations for all local fonts
 * This component creates CSS rules that allow font previews to render correctly
 */
const FontFaceLoader: React.FC = () => {
  const fontFaceStyles = useMemo(() => {
    const styles: string[] = [];
    
    FONT_OPTIONS.forEach((font, idx) => {
      // Check if it's a local font (contains url('/fonts/...'))
      if (font.family.includes("url('/fonts/")) {
        // Extract URL from family string like: url('/fonts/corsivo/Hello%20Beauty.ttf')
        const urlMatch = font.family.match(/url\(['"]?([^'")\]]+)['"]?\)/);
        if (urlMatch && urlMatch[1]) {
          const fontUrl = urlMatch[1];
          // Create unique font family name for @font-face
          const fontFaceName = `LocalFont_${idx}`;
          
          // Determine format based on file extension
          let format = 'truetype';
          if (fontUrl.endsWith('.otf')) {
            format = 'opentype';
          } else if (fontUrl.endsWith('.woff')) {
            format = 'woff';
          } else if (fontUrl.endsWith('.woff2')) {
            format = 'woff2';
          }
          
          styles.push(`
            @font-face {
              font-family: '${fontFaceName}';
              src: url('${fontUrl}') format('${format}');
              font-display: swap;
            }
          `);
        }
      }
    });

    return styles.join('\n');
  }, []);

  return <style dangerouslySetInnerHTML={{ __html: fontFaceStyles }} />;
};

/**
 * Get the @font-face family name for a given font
 */
export const getFontFaceName = (fontFamily: string, fontIndex: number): string => {
  if (fontFamily.includes("url('/fonts/")) {
    return `LocalFont_${fontIndex}`;
  }
  // For CDN fonts, return the name as-is
  return fontFamily.split(',')[0].replace(/['"]/g, '').trim();
};

export default FontFaceLoader;
