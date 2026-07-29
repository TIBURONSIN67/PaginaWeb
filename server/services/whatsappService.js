/*
Servicio de comunicación con WhatsApp Cloud API de Meta.

Responsabilidades:
- Enviar mensajes de texto, imágenes, documentos y audio.
- Extraer datos de mensajes entrantes (texto, imagen, audio, ubicación, documentos).
- Descargar archivos multimedia desde los servidores de Meta.
- Manejar reintentos y errores de la API de Meta.

No contiene lógica de negocio ni acceso directo a base de datos.
Dependencias: config/meta.js, utils/logger.js
*/

import axios from 'axios';
import { META_CONFIG } from '../config/meta.js';
import { logger } from '../utils/logger.js';

export const whatsappService = {
  /**
   * Envía un mensaje de texto a un número de WhatsApp.
   * @param {string} phone - Número de teléfono del destinatario (ID de WhatsApp)
   * @param {string} message - Texto del mensaje (máx 4096 caracteres)
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async sendMessage(phone, message) {
    if (!META_CONFIG.accessToken || !META_CONFIG.phoneNumberId) {
      logger.warn('WhatsApp: credenciales no configuradas');
      return { success: false, error: 'WhatsApp no configurado' };
    }

    try {
      const response = await axios.post(
        META_CONFIG.messageEndpoint,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phone,
          type: 'text',
          text: { preview_url: false, body: message }
        },
        {
          headers: {
            'Authorization': `Bearer ${META_CONFIG.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.outgoing(phone, message.substring(0, 100));
      return { success: true, data: response.data };
    } catch (err) {
      logger.error('WhatsApp: error al enviar mensaje de texto', err.response?.data || err.message);
      return { success: false, error: err.response?.data?.error?.message || err.message };
    }
  },

  /**
   * Envía una imagen a WhatsApp usando una URL pública.
   * La imagen debe estar alojada en un servidor accesible (HTTP/HTTPS).
   * @param {string} phone - Número del destinatario
   * @param {string} imageUrl - URL pública de la imagen (jpg, png, webp)
   * @param {string} caption - Texto opcional que acompaña la imagen
   */
  async sendImage(phone, imageUrl, caption = '') {
    if (!META_CONFIG.accessToken || !META_CONFIG.phoneNumberId) {
      return { success: false, error: 'WhatsApp no configurado' };
    }

    try {
      const response = await axios.post(
        META_CONFIG.messageEndpoint,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phone,
          type: 'image',
          image: {
            link: imageUrl,
            caption: caption || undefined
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${META_CONFIG.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.outgoing(phone, `[Imagen] ${caption}`);
      return { success: true, data: response.data };
    } catch (err) {
      logger.error('WhatsApp: error al enviar imagen', err.response?.data || err.message);
      return { success: false, error: err.response?.data?.error?.message || err.message };
    }
  },

  /**
   * Envía un documento (PDF, archivo) a WhatsApp.
   * @param {string} phone - Número del destinatario
   * @param {string} documentUrl - URL pública del documento
   * @param {string} filename - Nombre del archivo a mostrar
   * @param {string} caption - Texto opcional
   */
  async sendDocument(phone, documentUrl, filename = 'documento', caption = '') {
    if (!META_CONFIG.accessToken || !META_CONFIG.phoneNumberId) {
      return { success: false, error: 'WhatsApp no configurado' };
    }

    try {
      const response = await axios.post(
        META_CONFIG.messageEndpoint,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phone,
          type: 'document',
          document: {
            link: documentUrl,
            filename: filename,
            caption: caption || undefined
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${META_CONFIG.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return { success: true, data: response.data };
    } catch (err) {
      logger.error('WhatsApp: error al enviar documento', err.response?.data || err.message);
      return { success: false, error: err.response?.data?.error?.message || err.message };
    }
  },

  /**
   * Descarga un archivo multimedia desde los servidores de Meta usando el media_id.
   * Útil para guardar imágenes, audios o documentos enviados por clientes.
   * @param {string} mediaId - ID del archivo en los servidores de Meta
   * @returns {Promise<{success: boolean, data?: Buffer, contentType?: string, error?: string}>}
   */
  async downloadMedia(mediaId) {
    if (!META_CONFIG.accessToken) {
      return { success: false, error: 'Token no configurado' };
    }

    try {
      // Paso 1: Obtener URL de descarga
      const urlRes = await axios.get(
        `${META_CONFIG.baseUrl}/${mediaId}`,
        { headers: { 'Authorization': `Bearer ${META_CONFIG.accessToken}` } }
      );

      const mediaUrl = urlRes.data?.url;
      if (!mediaUrl) {
        return { success: false, error: 'No se pudo obtener URL de descarga' };
      }

      // Paso 2: Descargar el archivo
      const downloadRes = await axios.get(mediaUrl, {
        headers: { 'Authorization': `Bearer ${META_CONFIG.accessToken}` },
        responseType: 'arraybuffer'
      });

      return {
        success: true,
        data: Buffer.from(downloadRes.data),
        contentType: downloadRes.headers['content-type'] || urlRes.data?.mime_type || ''
      };
    } catch (err) {
      logger.error('WhatsApp: error al descargar multimedia', err.response?.data || err.message);
      return { success: false, error: err.response?.data?.error?.message || err.message };
    }
  },

  /**
   * Extrae datos estructurados del payload de webhook de Meta.
   * Soporta mensajes de texto, imagen, audio, video, documento, ubicación y stickers.
   * También extrae actualizaciones de estado (enviado, entregado, leído).
   *
   * @param {object} body - Cuerpo del POST del webhook de Meta
   * @returns {object|null} Datos del mensaje o null si no es un evento soportado
   *
   * Formato de retorno para mensajes:
   * {
   *   phone: string,         // ID de WhatsApp del remitente
   *   name: string,          // Nombre del perfil
   *   message: string,       // Texto o descripción del contenido
   *   messageType: string,   // 'text', 'image', 'audio', 'video', 'document', 'location', 'sticker'
   *   mediaId: string|null,  // ID para descargar el archivo (imagen/audio/video)
   *   caption: string|null,  // Texto adjunto a la imagen/documento
   *   timestamp: string,     // Fecha ISO 8601
   *   messageId: string      // ID único del mensaje en WhatsApp
   * }
   */
  extractMessageData(body) {
    try {
      const entry = body?.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value || {};

      if (value.messages && value.messages.length > 0) {
        const msg = value.messages[0];
        const contact = value.contacts?.[0];

        let messageText = '';
        let messageType = msg.type || 'text';
        let mediaId = null;
        let caption = null;

        switch (msg.type) {
          case 'text':
            messageText = msg.text?.body || '';
            messageType = 'text';
            break;
          case 'image':
            messageText = msg.image?.caption || '📷 Imagen recibida';
            messageType = 'image';
            mediaId = msg.image?.id || null;
            caption = msg.image?.caption || null;
            break;
          case 'audio':
            messageText = msg.audio?.voice_note ? '🎤 Nota de voz' : '🎵 Audio recibido';
            messageType = 'audio';
            mediaId = msg.audio?.id || null;
            break;
          case 'video':
            messageText = msg.video?.caption || '🎬 Video recibido';
            messageType = 'video';
            mediaId = msg.video?.id || null;
            caption = msg.video?.caption || null;
            break;
          case 'document':
            messageText = msg.document?.caption || `📄 Documento: ${msg.document?.filename || 'archivo'}`;
            messageType = 'document';
            mediaId = msg.document?.id || null;
            caption = msg.document?.caption || null;
            break;
          case 'location':
            messageText = '📍 Ubicación compartida';
            messageType = 'location';
            break;
          case 'sticker':
            messageText = msg.sticker?.id ? '😀 Sticker' : 'Sticker';
            messageType = 'sticker';
            mediaId = msg.sticker?.id || null;
            break;
          default:
            messageText = `[${msg.type}] Mensaje no soportado`;
            messageType = msg.type;
        }

        return {
          phone: msg.from,
          name: contact?.profile?.name || 'Cliente',
          message: messageText,
          messageType,
          mediaId,
          caption,
          timestamp: msg.timestamp ? new Date(parseInt(msg.timestamp) * 1000).toISOString() : new Date().toISOString(),
          messageId: msg.id
        };
      }

      if (value.statuses && value.statuses.length > 0) {
        return {
          type: 'status',
          status: value.statuses[0].status,
          messageId: value.statuses[0].id,
          phone: value.statuses[0].recipient_id
        };
      }

      return null;
    } catch (err) {
      logger.error('WhatsApp: error al extraer datos del webhook', err);
      return null;
    }
  }
};
