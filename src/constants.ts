import { FontOption, FontStyle, FinishType, MountingMethod } from './types';

// LOCAL FONTS (serve dalle cartelle public/fonts/corsivo e public/fonts/stampatello)
const LOCAL_FONTS_CORSIVO: FontOption[] = [
  // Corsivi - Script professionali e eleganti
  { name: 'Ventilla Script', family: "url('/fonts/corsivo/Ventilla Script.ttf')", style: FontStyle.CORSIVO },
  { name: 'Hello Cinta', family: "url('/fonts/corsivo/Hello Cinta.ttf')", style: FontStyle.CORSIVO },
  { name: 'Hello Dina Script', family: "url('/fonts/corsivo/Hello Dina Script.ttf')", style: FontStyle.CORSIVO },
  { name: 'Hello Valentina', family: "url('/fonts/corsivo/Hello Valentina.ttf')", style: FontStyle.CORSIVO },
  { name: 'Lovely Australia', family: "url('/fonts/corsivo/Lovely Australia.ttf')", style: FontStyle.CORSIVO },
  { name: 'marchelina script', family: "url('/fonts/corsivo/marchelina script.ttf')", style: FontStyle.CORSIVO },
  { name: 'Scarlet Pen', family: "url('/fonts/corsivo/Scarlet Pen.ttf')", style: FontStyle.CORSIVO },
  { name: 'Allura Regular', family: "url('/fonts/corsivo/Allura-Regular.ttf')", style: FontStyle.CORSIVO },
];

const LOCAL_FONTS_STAMPATELLO: FontOption[] = [
  // Stampatello - Font moderni, geometrici, legibili
  { name: 'Arial Bold', family: "url('/fonts/stampatello/arial.ttf')", style: FontStyle.STAMPATELLO },
  { name: 'Babylon', family: "url('/fonts/stampatello/Babylon.ttf')", style: FontStyle.STAMPATELLO },
  { name: 'Robot Roc', family: "url('/fonts/stampatello/Robot Roc.ttf')", style: FontStyle.STAMPATELLO },
  { name: 'Revolution', family: "url('/fonts/stampatello/REVOLUTION.ttf')", style: FontStyle.STAMPATELLO },
  { name: 'Sasha', family: "url('/fonts/stampatello/Sasha.ttf')", style: FontStyle.STAMPATELLO },
  { name: 'Smallville', family: "url('/fonts/stampatello/Smallville1.ttf')", style: FontStyle.STAMPATELLO },
  { name: 'Space Punk', family: "url('/fonts/stampatello/space punk PG_ital.ttf')", style: FontStyle.STAMPATELLO },
  { name: 'Taylor Gothic', family: "url('/fonts/stampatello/TaylorGothic.otf')", style: FontStyle.STAMPATELLO },
  { name: 'Ultra Marine', family: "url('/fonts/stampatello/Ultramarine.otf')", style: FontStyle.STAMPATELLO },
  { name: 'SWATRG', family: "url('/fonts/stampatello/SWATRG_.TTF')", style: FontStyle.STAMPATELLO },
  { name: 'Golden Cosmic', family: "url('/fonts/stampatello/GOLDEN COSMIC REGULER.ttf')", style: FontStyle.STAMPATELLO },
  { name: 'Italian Ultras', family: "url('/fonts/stampatello/Italian Ultras.ttf')", style: FontStyle.STAMPATELLO },
  { name: 'Nostalgia', family: "url('/fonts/stampatello/Nostalgia.ttf')", style: FontStyle.STAMPATELLO },
  { name: 'TT Omnib', family: "url('/fonts/stampatello/TT_OMNIB.ttf')", style: FontStyle.STAMPATELLO },
  { name: 'Laser', family: "url('/fonts/stampatello/Laser.ttf')", style: FontStyle.STAMPATELLO },
  { name: 'Lance IP', family: "url('/fonts/stampatello/lancip.ttf')", style: FontStyle.STAMPATELLO },
];

export const FONT_OPTIONS: FontOption[] = [
  // --- CORSIVO (Script/Calligraphic/Handwriting) ---
  { name: 'Elegante', family: "'Great Vibes', cursive", style: FontStyle.CORSIVO },
  { name: 'Dinamico', family: "'Dancing Script', cursive", style: FontStyle.CORSIVO },
  { name: 'Romantico', family: "'Allura', cursive", style: FontStyle.CORSIVO },
  { name: 'Prezioso', family: "'Pinyon Script', cursive", style: FontStyle.CORSIVO },
  { name: 'Moderno', family: "'Pacifico', cursive", style: FontStyle.CORSIVO },
  { name: 'Dolce', family: "'Cookie', cursive", style: FontStyle.CORSIVO },
  { name: 'Parigino', family: "'Parisienne', cursive", style: FontStyle.CORSIVO },
  { name: 'Vintage', family: "'Yellowtail', cursive", style: FontStyle.CORSIVO },
  { name: 'Fluido', family: "'Sacramento', cursive", style: FontStyle.CORSIVO },
  { name: 'Nautico', family: "'Lobster', cursive", style: FontStyle.CORSIVO },
  { name: 'Soddisfacente', family: "'Satisfy', cursive", style: FontStyle.CORSIVO },
  ...LOCAL_FONTS_CORSIVO,
  { name: 'Pennello', family: "'Courgette', cursive", style: FontStyle.CORSIVO },
  { name: 'Ribelle', family: "'Kaushan Script', cursive", style: FontStyle.CORSIVO },
  { name: 'Artistico', family: "'Marck Script', cursive", style: FontStyle.CORSIVO },
  { name: 'Casual', family: "'Damion', cursive", style: FontStyle.CORSIVO },
  { name: 'Retro', family: "'Mr Dafoe', cursive", style: FontStyle.CORSIVO },
  { name: 'Aristocratico', family: "'Monsieur La Doulaise', cursive", style: FontStyle.CORSIVO },
  { name: 'Veloce', family: "'Alex Brush', cursive", style: FontStyle.CORSIVO },
  { name: 'Cerimoniale', family: "'Petit Formal Script', cursive", style: FontStyle.CORSIVO },
  { name: 'Fine', family: "'Aguafina Script', cursive", style: FontStyle.CORSIVO },
  { name: 'Storico', family: "'Herr Von Muellerhoff', cursive", style: FontStyle.CORSIVO },
  { name: 'Classico Alto', family: "'Tangerine', cursive", style: FontStyle.CORSIVO },
  { name: 'Spontaneo', family: "'Bad Script', cursive", style: FontStyle.CORSIVO },
  { name: 'Simpatico', family: "'Comic Neue', cursive", style: FontStyle.CORSIVO },
  // Nuovi Font Corsivi / Eleganti
  { name: 'Scuola', family: "'Caveat', cursive", style: FontStyle.CORSIVO },
  { name: 'Raffinato', family: "'Bodoni Moda', serif", style: FontStyle.CORSIVO },
  { name: 'Moderno Corsivo', family: "'Quicksand', sans-serif", style: FontStyle.CORSIVO },

  // --- STAMPATELLO (Block/Serif/Sans/Display) ---
  { name: 'Lusso', family: "'Playfair Display', serif", style: FontStyle.STAMPATELLO },
  { name: 'Geometrico', family: "'Montserrat', sans-serif", style: FontStyle.STAMPATELLO },
  { name: 'Leggibile', family: "'Open Sans', sans-serif", style: FontStyle.STAMPATELLO },
  { name: 'Morbido', family: "'Nunito', sans-serif", style: FontStyle.STAMPATELLO },
  { name: 'Tech', family: "'Poppins', sans-serif", style: FontStyle.STAMPATELLO },
  { name: 'Robusto', family: "'Roboto Slab', serif", style: FontStyle.STAMPATELLO },
  { name: 'Marino', family: "'Lato', sans-serif", style: FontStyle.STAMPATELLO },
  { name: 'Romano', family: "'Cinzel', serif", style: FontStyle.STAMPATELLO },
  { name: 'Editoriale', family: "'Lora', serif", style: FontStyle.STAMPATELLO },
  { name: 'Letterario', family: "'Bitter', serif", style: FontStyle.STAMPATELLO },
  { name: 'Impatto', family: "'Anton', sans-serif", style: FontStyle.STAMPATELLO },
  { name: 'Grassetto', family: "'Oswald', sans-serif", style: FontStyle.STAMPATELLO },
  { name: 'Poster', family: "'Bebas Neue', sans-serif", style: FontStyle.STAMPATELLO },
  { name: 'Cinema', family: "'Fjalla One', sans-serif", style: FontStyle.STAMPATELLO },
  { name: 'Russo', family: "'Russo One', sans-serif", style: FontStyle.STAMPATELLO },
  { name: 'Divertente', family: "'Luckiest Guy', cursive", style: FontStyle.STAMPATELLO },
  { name: 'Stencil', family: "'Saira Stencil One', cursive", style: FontStyle.STAMPATELLO },
  { name: 'Futuro', family: "'Righteous', cursive", style: FontStyle.STAMPATELLO },
  { name: 'Minimal', family: "'Raleway', sans-serif", style: FontStyle.STAMPATELLO },
  { name: 'Fashion', family: "'Abril Fatface', cursive", style: FontStyle.STAMPATELLO },
  { name: 'Tecnologico', family: "'Exo 2', sans-serif", style: FontStyle.STAMPATELLO },
  { name: 'Cyber', family: "'Orbitron', sans-serif", style: FontStyle.STAMPATELLO },
  { name: 'Solido', family: "'Kanit', sans-serif", style: FontStyle.STAMPATELLO },
  { name: 'Quadrato', family: "'Prompt', sans-serif", style: FontStyle.STAMPATELLO },
  { name: 'Ubuntu', family: "'Ubuntu', sans-serif", style: FontStyle.STAMPATELLO },
  { name: 'Arrotondato', family: "'Rubik', sans-serif", style: FontStyle.STAMPATELLO },
  // Nuovi Font Stampatello / Moderni
  { name: 'Futuristico', family: "'Space Mono', monospace", style: FontStyle.STAMPATELLO },
  { name: 'Minimale', family: "'Source Sans 3', sans-serif", style: FontStyle.STAMPATELLO },
  { name: 'Spesso Nero', family: "'IBM Plex Sans', sans-serif", style: FontStyle.STAMPATELLO },
  { name: 'Scientifico', family: "'Courier Prime', monospace", style: FontStyle.STAMPATELLO },
  { name: 'Moderno Bold', family: "'Work Sans', sans-serif", style: FontStyle.STAMPATELLO },
  { name: 'Leggero Elegante', family: "'Mulish', sans-serif", style: FontStyle.STAMPATELLO },
  { name: 'Corporativo', family: "'Barlow', sans-serif", style: FontStyle.STAMPATELLO },
  { name: 'Vintage Serif', family: "'Cormorant Garamond', serif", style: FontStyle.STAMPATELLO },
  { name: 'Artistico', family: "'Fredoka', sans-serif", style: FontStyle.STAMPATELLO },
  { name: 'Moderno Ampio', family: "'Roboto', sans-serif", style: FontStyle.STAMPATELLO },
  ...LOCAL_FONTS_STAMPATELLO,

  // System Fallbacks
  { name: 'Giornale', family: "Times New Roman, serif", style: FontStyle.STAMPATELLO },
  { name: 'Macchina', family: "Courier New, monospace", style: FontStyle.STAMPATELLO },
];

export const THICKNESS_OPTIONS = ['2mm', '3mm', '4mm', '5mm'];

export const FINISH_OPTIONS = [
  { id: FinishType.GLOSSY, label: 'Lucida', description: 'Superficie specchiata brillante' },
  { id: FinishType.SATIN, label: 'Satinata', description: 'Finitura opaca elegante' },
  { id: FinishType.PAINTED, label: 'Verniciata', description: 'Colore personalizzato' },
];

export const MOUNTING_OPTIONS = [
  { id: MountingMethod.TAPE, label: 'Biadesivo', description: 'Per superfici lisce e piane' },
  { id: MountingMethod.PINS, label: 'Perni Meccanici', description: 'Fissaggio robusto distanziato' },
  { id: MountingMethod.SCREWS, label: 'Viti Autofilettanti', description: 'Installazione diretta' },
];