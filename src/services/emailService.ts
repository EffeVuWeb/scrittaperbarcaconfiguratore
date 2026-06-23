import emailjs from '@emailjs/browser';
import { FormData, UserType } from '../types';

// Queste chiavi verranno fornite dall'utente in seguito.
// Per ora utilizziamo dei placeholder.
const EMAILJS_SERVICE_ID = 'service_kwo0igk';
const EMAILJS_TEMPLATE_ID = 'template_r9v8cdy';
const EMAILJS_PUBLIC_KEY = '0taXZkkAh5yEWSlWW';

export const sendQuoteRequest = async (formData: FormData, screenshot: string | null): Promise<void> => {
  try {
    // Sanitize function to remove problematic characters
    const sanitize = (value: any): string => {
      if (!value && value !== 0) return '';
      return String(value).replace(/[\r\n\t]/g, ' ').trim();
    };

    const senderName = (formData.userType === UserType.SHIPYARD || formData.userType === UserType.AZIENDE) && formData.ragioneSociale?.trim()
      ? formData.ragioneSociale
      : `${formData.firstName || ''} ${formData.lastName || ''}`.trim();

    // Template params matching the EmailJS template exactly
    const templateParams = {
      from_name: sanitize(senderName) || 'Cliente',
      from_email: sanitize(formData.email) || 'noemail@example.com',
      phone: sanitize(formData.phone) || '',
      user_type: sanitize(formData.userType) || '',
      ragione_sociale: sanitize(formData.ragioneSociale) || '',
      partita_iva: sanitize(formData.partitaIva) || '',
      boat_name: sanitize(formData.boatName) || 'N/A',
      dimensions: `${sanitize(formData.length)} x ${sanitize(formData.height)} cm`,
      thickness: sanitize(formData.thickness) || '',
      font_style: `Font #${formData.fontIndex || 1}: ${sanitize(formData.selectedFontName) || 'N/A'}`,
      finish: sanitize(formData.finishType) || '',
      color: sanitize(formData.paintColor) || '',
      mounting: sanitize(formData.mountingMethod) || '',
      notes: sanitize(formData.notes) || '',
      project_image_name: sanitize(formData.projectImage?.name) || '',
      preview_screenshot: screenshot || ''
    };

    // Debug: log presence/size of preview screenshot and project before sending
    console.log('DEBUG: Sending templateParams:', templateParams);
    if (templateParams.preview_screenshot) {
      try { console.log('DEBUG: preview_screenshot length =', String(templateParams.preview_screenshot).length); } catch (e) { /* ignore */ }
    } else {
      console.log('DEBUG: no preview_screenshot present');
    }
    if (templateParams.project_image_name) {
      try { console.log('DEBUG: project_image_name =', templateParams.project_image_name); } catch (e) { /* ignore */ }
    }

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log('SUCCESS!', response.status, response.text);
  } catch (error: any) {
    console.error('FAILED...', error);
    // Log dettagliato per capire se è un problema di autenticazione o dimensione
    if (error.status) {
      console.error('EmailJS Error Status:', error.status);
    }
    if (error.text) {
      console.error('EmailJS Error Text:', error.text);
    }
    if (error && typeof error === 'object') {
      console.error('Full Error Object:', JSON.stringify(error, null, 2));
    }
    throw error;
  }
};
