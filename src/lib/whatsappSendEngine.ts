import { supabase } from '@/integrations/supabase/client';

export interface WhatsAppUser {
  user_id: string;
  nome: string;
  telefone: string | null;
}

export interface SendResult {
  user_id: string;
  success: boolean;
  error?: string;
}

export interface SendProgress {
  total: number;
  sent: number;
  success: number;
  failed: number;
}

export interface EngineState {
  isRunning: boolean;
  isPaused: boolean;
  progress: SendProgress;
  results: SendResult[];
  countdown: number;
}

type Listener = (state: EngineState) => void;

class WhatsAppSendEngine {
  private queue: WhatsAppUser[] = [];
  private isPaused = false;
  private isRunning = false;
  private progress: SendProgress = { total: 0, sent: 0, success: 0, failed: 0 };
  private results: SendResult[] = [];
  private countdown = 0;
  private listeners = new Set<Listener>();

  getState(): EngineState {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      progress: { ...this.progress },
      results: [...this.results],
      countdown: this.countdown,
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach(l => l(state));
  }

  pause() {
    if (this.isRunning && !this.isPaused) {
      this.isPaused = true;
      this.notify();
    }
  }

  resume() {
    if (this.isRunning && this.isPaused) {
      this.isPaused = false;
      this.notify();
    }
  }

  togglePause() {
    if (this.isPaused) this.resume();
    else this.pause();
  }

  reset() {
    this.queue = [];
    this.isRunning = false;
    this.isPaused = false;
    this.progress = { total: 0, sent: 0, success: 0, failed: 0 };
    this.results = [];
    this.countdown = 0;
    this.notify();
  }

  get pendingCount() {
    return this.queue.length;
  }

  async start(users: WhatsAppUser[], message: string, token: string) {
    if (this.isRunning) return;

    this.queue = [...users];
    this.isRunning = true;
    this.isPaused = false;
    this.results = [];
    this.countdown = 0;
    this.progress = { total: users.length, sent: 0, success: 0, failed: 0 };
    this.notify();

    await this.processQueue(message, token);
  }

  private async waitWhilePaused() {
    while (this.isPaused) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  private async processQueue(message: string, token: string) {
    while (this.queue.length > 0) {
      await this.waitWhilePaused();

      const user = this.queue[0];
      const personalizedMessage = message.replace(/\{nome\}/g, user.nome);

      try {
        const response = await supabase.functions.invoke('send-whatsapp', {
          body: {
            action: 'send-text',
            phone: user.telefone,
            message: personalizedMessage,
            channel: 'default',
          },
          headers: { Authorization: `Bearer ${token}` },
        });

        const success = !response.error && response.data?.success;
        this.results.push({
          user_id: user.user_id,
          success,
          error: response.data?.error || response.error?.message,
        });
        this.progress.sent++;
        if (success) this.progress.success++;
        else this.progress.failed++;
      } catch (err: any) {
        this.results.push({ user_id: user.user_id, success: false, error: err.message });
        this.progress.sent++;
        this.progress.failed++;
      }

      this.queue = this.queue.slice(1);
      this.notify();

      // Delay 15-35s between messages
      if (this.queue.length > 0) {
        const delayMs = Math.floor(Math.random() * (35000 - 15000 + 1)) + 15000;
        const delaySec = Math.ceil(delayMs / 1000);
        for (let s = delaySec; s > 0; s--) {
          await this.waitWhilePaused();
          this.countdown = s;
          this.notify();
          await new Promise(r => setTimeout(r, 1000));
        }
        this.countdown = 0;
        this.notify();
      }
    }

    this.isRunning = false;
    this.notify();
  }
}

export const whatsappEngine = new WhatsAppSendEngine();
