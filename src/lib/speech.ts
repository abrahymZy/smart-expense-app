// lib/speech.ts
// دعم التعرف الصوتي باللغة العربية عبر Web Speech API

type TranscriptCallback = (transcript: string) => void;
type ErrorCallback = (errorMessage: string) => void;
type EndCallback = () => void;

interface IWindowSpeech extends Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
}

class SpeechRecognizer {
  private recognition: any = null;
  private isListening = false;

  constructor() {
    if (typeof window !== "undefined") {
      const win = window as unknown as IWindowSpeech;
      const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = "ar-YE"; // اللهجة اليمنية / العربية
      }
    }
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }

  public start(onResult: TranscriptCallback, onError: ErrorCallback, onEnd: EndCallback): void {
    if (!this.recognition) {
      onError("متصفحك لا يدعم الإدخال الصوتي المباشر. يرجى استخدام متصفح حديث مثل Chrome.");
      onEnd();
      return;
    }

    if (this.isListening) {
      this.stop();
    }

    this.recognition.onstart = () => {
      this.isListening = true;
    };

    this.recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        onResult(transcript);
      } else {
        onError("لم يتم التقاط أي صوت واضح، يرجى المحاولة مرة أخرى.");
      }
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      let msg = "حدث خطأ أثناء الاستماع.";
      if (event.error === "no-speech") {
        msg = "لم يتم التقاط أي صوت. تحدث بالقرب من الميكروفون.";
      } else if (event.error === "not-allowed" || event.error === "permission-denied") {
        msg = "تم رفض إذن الوصول إلى الميكروفون. يرجى تفعيله من إعدادات المتصفح.";
      }
      onError(msg);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    try {
      this.recognition.start();
    } catch (err) {
      console.error("Speech start error:", err);
      this.isListening = false;
      onEnd();
    }
  }

  public stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore stop errors
      }
      this.isListening = false;
    }
  }
}

export const speechRecognizer = new SpeechRecognizer();
