export enum UserType {
  PRIVATE = 'Privato',
  SHIPYARD = 'Rimessaggio / Cantiere',
  AZIENDE = 'Aziende',
}

export enum FinishType {
  GLOSSY = 'Lucida',
  SATIN = 'Satinata',
  PAINTED = 'Verniciata',
}

export enum MountingMethod {
  TAPE = 'Biadesivo',
  PINS = 'Perni Meccanici',
  SCREWS = 'Viti Autofilettanti',
}

export enum FontStyle {
  CORSIVO = 'Corsivo',
  STAMPATELLO = 'Stampatello',
}

export interface FormData {
  // Step 1: Dati Personali
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // Campi per Cantiere/Rimessaggio e Aziende
  ragioneSociale: string;
  partitaIva: string;

  // Step 2: Tipo Utente
  userType: UserType | null;

  // Step 3: Dati Tecnici
  boatName: string;
  length: string; // cm
  height: string; // cm
  thickness: '2mm' | '3mm' | '4mm' | '5mm';
  projectImage: { name: string; dataUri: string } | null; // "Hai già un progetto?" - stored as base64 dataURI

  // Step 4: Font
  fontStylePreference: FontStyle;
  selectedFontFamily: string;
  selectedFontName: string; // Nome leggibile del font (es. "Great Vibes")
  fontIndex: number; // Numero progressivo del font nella lista

  // Step 5: Finitura e Montaggio
  finishType: FinishType;
  paintColor: string; // Hex for preview
  paintColorCode: string; // Text input for RAL/Code
  mountingMethod: MountingMethod;
  notes: string;
}

export interface FontOption {
  name: string;
  family: string;
  style: FontStyle; // Used for filtering Corsivo/Stampatello
}