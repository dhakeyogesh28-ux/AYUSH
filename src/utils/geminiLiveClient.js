/**
 * Gemini Multimodal Live Client
 * Real-time Bidirectional Speech-to-Speech WebSocket Client
 * 
 * Audio Specifications:
 * - Client Input: 16kHz 16-bit Linear PCM (Mono) -> Base64
 * - Gemini Output: 24kHz 16-bit Linear PCM (Mono) Base64 -> AudioContext playback queue
 */

export class GeminiLiveClient {
  constructor({
    sessionId,
    languageCode = 'en',
    opdMode = 'allopathy',
    onTextChunk,
    onAudioChunk,
    onAudioPlayStart,
    onAudioPlayEnd,
    onTurnComplete,
    onError,
    onStatusChange,
  }) {
    this.sessionId = sessionId;
    this.languageCode = languageCode;
    this.opdMode = opdMode;
    this.onTextChunk = onTextChunk;
    this.onAudioChunk = onAudioChunk;
    this.onAudioPlayStart = onAudioPlayStart;
    this.onAudioPlayEnd = onAudioPlayEnd;
    this.onTurnComplete = onTurnComplete;
    this.onError = onError;
    this.onStatusChange = onStatusChange;

    this.ws = null;
    this.audioInputContext = null;
    this.audioOutputContext = null;
    this.mediaStream = null;
    this.processorNode = null;
    this.sourceNode = null;
    this.isRecording = false;
    this.isConnected = false;

    // Audio Output Playback Queue (24kHz PCM from Gemini Live)
    this.playbackQueue = [];
    this.isPlayingAudio = false;
    this.scheduledTime = 0;
  }

  /**
   * Connect to Backend Gemini Live WebSocket Gateway
   */
  async connect() {
    this.onStatusChange?.('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/live-conversation?session_id=${encodeURIComponent(
      this.sessionId
    )}&lang=${encodeURIComponent(this.languageCode)}&mode=${encodeURIComponent(
      this.opdMode
    )}`;

    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.onStatusChange?.('ready');
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          this.handleServerMessage(event.data);
        };

        this.ws.onerror = (err) => {
          console.warn('Gemini Live WS unavailable, falling back to REST mode:', err);
          this.isConnected = false;
          this.onStatusChange?.('ready');
          resolve(false);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.onStatusChange?.('ready');
        };
      } catch (err) {
        console.warn('WS initialization issue, using REST mode:', err);
        this.isConnected = false;
        resolve(false);
      }
    });
  }

  /**
   * Handle incoming messages from Backend / Gemini Live
   */
  async handleServerMessage(data) {
    try {
      const msg = JSON.parse(data);

      if (msg.type === 'text_chunk') {
        this.onTextChunk?.(msg.text);
      } else if (msg.type === 'audio_chunk') {
        this.onAudioChunk?.(msg.data);
        this.enqueueAudioChunk(msg.data);
      } else if (msg.type === 'turn_complete') {
        this.onTurnComplete?.(msg.clinical_record);
      } else if (msg.type === 'error') {
        console.warn('Backend live error:', msg.message);
        this.onError?.(new Error(msg.message));
      }
    } catch (e) {
      console.error('Error parsing live WS message:', e);
    }
  }

  /**
   * Start 16kHz Microphone Capture
   */
  async startRecording() {
    if (this.isRecording) return;
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioInputContext = new AudioCtx({ sampleRate: 16000 });
      this.sourceNode = this.audioInputContext.createMediaStreamSource(this.mediaStream);

      // ScriptProcessor for PCM 16-bit conversion
      const bufferSize = 4096;
      this.processorNode = this.audioInputContext.createScriptProcessor(bufferSize, 1, 1);

      this.processorNode.onaudioprocess = (e) => {
        if (!this.isRecording || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = this.float32ToInt16(inputData);
        const base64Audio = this.arrayBufferToBase64(pcm16.buffer);

        this.ws.send(
          JSON.stringify({
            type: 'audio_pcm',
            mimeType: 'audio/pcm;rate=16000',
            data: base64Audio,
          })
        );
      };

      this.sourceNode.connect(this.processorNode);
      this.processorNode.connect(this.audioInputContext.destination);
      this.isRecording = true;
      this.onStatusChange?.('listening');
    } catch (err) {
      console.error('Microphone capture error:', err);
      this.onError?.(err);
    }
  }

  /**
   * Stop Microphone Capture
   */
  stopRecording() {
    this.isRecording = false;
    if (this.processorNode && this.sourceNode) {
      try {
        this.sourceNode.disconnect();
        this.processorNode.disconnect();
      } catch {
        // Ignore audio node disconnect error
      }
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioInputContext) {
      this.audioInputContext.close().catch(() => {});
      this.audioInputContext = null;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'end_turn' }));
    }
    this.onStatusChange?.('idle');
  }

  /**
   * Send Text Prompt to Gemini Live
   */
  sendTextPrompt(text) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'text_prompt',
          text,
        })
      );
    }
  }

  /**
   * Enqueue 24kHz PCM audio chunk for real-time speaker playback
   */
  async enqueueAudioChunk(base64Data) {
    if (!this.audioOutputContext || this.audioOutputContext.state === 'closed') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioOutputContext = new AudioCtx({ sampleRate: 24000 });
    }

    if (this.audioOutputContext.state === 'suspended') {
      await this.audioOutputContext.resume();
    }

    const arrayBuffer = this.base64ToArrayBuffer(base64Data);
    const int16 = new Int16Array(arrayBuffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }

    const audioBuffer = this.audioOutputContext.createBuffer(
      1,
      float32.length,
      24000
    );
    audioBuffer.getChannelData(0).set(float32);

    const source = this.audioOutputContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioOutputContext.destination);

    const currentTime = this.audioOutputContext.currentTime;
    if (this.scheduledTime < currentTime) {
      this.scheduledTime = currentTime;
    }

    source.start(this.scheduledTime);
    this.onAudioPlayStart?.();

    const duration = audioBuffer.duration;
    this.scheduledTime += duration;

    source.onended = () => {
      if (this.audioOutputContext && this.scheduledTime <= this.audioOutputContext.currentTime + 0.05) {
        this.onAudioPlayEnd?.();
      }
    };
  }

  /**
   * Float32 [-1.0, 1.0] to 16-bit Linear PCM
   */
  float32ToInt16(float32Array) {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
  }

  /**
   * ArrayBuffer to Base64
   */
  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Base64 to ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binary = window.atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Disconnect and Clean Up
   */
  disconnect() {
    this.stopRecording();
    if (this.ws) {
      try {
        this.ws.onerror = null;
        this.ws.onclose = null;
        this.ws.onmessage = null;
        this.ws.close();
      } catch {
        // Ignore ws close error
      }
      this.ws = null;
    }
    if (this.audioOutputContext) {
      try {
        this.audioOutputContext.close();
      } catch {
        // Ignore audio context close error
      }
      this.audioOutputContext = null;
    }
    this.isConnected = false;
  }
}

