/**
 * Multiplayer Pong Game Engine
 * Real-time 2-player game via Supabase
 */

import type { BaseGameEngine, GameContext, GameMetadata, GameControls, GameState, GameScore } from '../types';
import { DrawHelpers } from '../utils/drawHelpers';
import { gameSessionService } from './GameSessionService';
import type { GameSession, GameMove, PongMove } from './types';

interface Paddle {
  y: number;
  width: number;
  height: number;
  speed: number;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  speed: number;
}

type MultiplayerState = 'menu' | 'searching' | 'waiting' | 'connecting' | 'playing' | 'finished';

export class MultiplayerPongGame implements BaseGameEngine {
  metadata: GameMetadata = {
    id: 'multiplayer-pong',
    name: 'DUAL AXIS ONLINE',
    number: '05+',
    originalGame: 'Pong (1972)',
    difficulty: 'medium',
    estimatedTime: '5-10 min',
    genre: 'Online Multiplayer',
    description: 'Real-time 2-player competition',
  };

  controls: GameControls = {
    'W/↑': 'Move paddle up',
    'S/↓': 'Move paddle down',
    '1': 'Quick match',
    '2': 'Create private game',
    '3': 'Join with code',
    'Escape': 'Leave game',
  };

  private ctx!: CanvasRenderingContext2D;
  private _canvas!: HTMLCanvasElement;
  private width!: number;
  private height!: number;
  private state: GameState = 'idle';
  private score: GameScore = { current: 0, high: 0 };

  // Game constants
  private readonly PADDLE_WIDTH = 10;
  private readonly PADDLE_HEIGHT = 80;
  private readonly PADDLE_OFFSET = 30;
  private readonly PADDLE_SPEED = 8;
  private readonly BALL_SIZE = 12;
  private readonly INITIAL_BALL_SPEED = 6;
  private readonly MAX_BALL_SPEED = 15;
  private readonly SYNC_INTERVAL = 50; // ms between syncs

  // Multiplayer state
  private multiState: MultiplayerState = 'menu';
  private session: GameSession | null = null;
  private isHost = false;
  private myUserId: string | null = null;

  // Game state
  private myPaddle!: Paddle;
  private opponentPaddle!: Paddle;
  private ball!: Ball;
  private myScore = 0;
  private opponentScore = 0;
  private upPressed = false;
  private downPressed = false;
  private servingPlayer: 'me' | 'opponent' = 'me';
  private serveDelay = 0;
  private lastSyncTime = 0;
  private ballTrail: Array<{ x: number; y: number; alpha: number }> = [];

  // Input state for invite code
  private inviteCodeInput = '';
  private showInviteInput = false;

  // Messages
  private statusMessage = '';
  private errorMessage = '';

  // Polling fallback for when Realtime doesn't work
  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  private draw!: DrawHelpers;

  async init(context: GameContext): Promise<void> {
    this.ctx = context.ctx;
    this._canvas = context.canvas;
    this.width = context.width;
    this.height = context.height;
    this.draw = new DrawHelpers(this.ctx);

    // Get current user ID
    this.myUserId = await gameSessionService.getCurrentUserId();

    this.resetGame();
  }

  private resetGame(): void {
    this.myPaddle = {
      y: this.height / 2 - this.PADDLE_HEIGHT / 2,
      width: this.PADDLE_WIDTH,
      height: this.PADDLE_HEIGHT,
      speed: this.PADDLE_SPEED,
    };

    this.opponentPaddle = {
      y: this.height / 2 - this.PADDLE_HEIGHT / 2,
      width: this.PADDLE_WIDTH,
      height: this.PADDLE_HEIGHT,
      speed: this.PADDLE_SPEED,
    };

    this.resetBall();
    this.myScore = 0;
    this.opponentScore = 0;
    this.servingPlayer = 'me';
    this.serveDelay = 0;
  }

  private resetBall(): void {
    this.ball = {
      x: this.width / 2,
      y: this.height / 2,
      vx: 0,
      vy: 0,
      size: this.BALL_SIZE,
      speed: this.INITIAL_BALL_SPEED,
    };
    this.ballTrail = [];
  }

  private serveBall(): void {
    const angle = (Math.random() * 60 - 30) * (Math.PI / 180);
    // Host serves right, guest serves left
    const direction = (this.servingPlayer === 'me' && this.isHost) ||
                     (this.servingPlayer === 'opponent' && !this.isHost) ? 1 : -1;

    this.ball.vx = Math.cos(angle) * this.ball.speed * direction;
    this.ball.vy = Math.sin(angle) * this.ball.speed;
    this.serveDelay = 0;

    // Sync ball state if we're the host
    if (this.isHost) {
      this.syncBallState();
    }
  }

  start(): void {
    // Not used in multiplayer - game starts when opponent joins
  }

  pause(): void {
    // Multiplayer games can't be paused
  }

  resume(): void {
    // Not used
  }

  restart(): void {
    this.multiState = 'menu';
    this.session = null;
    this.resetGame();
    this.state = 'idle';
  }

  cleanup(): void {
    this.stopPolling();
    gameSessionService.unsubscribe();
  }

  // Multiplayer actions
  private async createQuickMatch(): Promise<void> {
    this.multiState = 'searching';
    this.statusMessage = 'Searching for opponent...';
    this.errorMessage = '';

    try {
      // First, try to find an existing session
      const sessions = await gameSessionService.findAvailableSessions('dual-axis');

      if (sessions.length > 0) {
        // Join existing session
        this.session = await gameSessionService.joinSession(sessions[0].id);
        this.isHost = false;
        await this.setupSession();
      } else {
        // Create new session
        this.session = await gameSessionService.createSession({
          gameId: 'dual-axis',
          maxScore: 11,
          isPrivate: false,
        });
        this.isHost = true;
        await this.setupSession();
        this.multiState = 'waiting';
        this.statusMessage = 'Waiting for opponent...';
      }
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Connection failed';
      this.multiState = 'menu';
    }
  }

  private async createPrivateGame(): Promise<void> {
    this.multiState = 'waiting';
    this.statusMessage = 'Creating private game...';
    this.errorMessage = '';

    try {
      this.session = await gameSessionService.createSession({
        gameId: 'dual-axis',
        maxScore: 11,
        isPrivate: true,
      });
      this.isHost = true;
      await this.setupSession();
      this.statusMessage = `Share code: ${this.session.inviteCode}`;
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Failed to create game';
      this.multiState = 'menu';
    }
  }

  private async joinWithCode(): Promise<void> {
    if (this.inviteCodeInput.length < 6) {
      this.errorMessage = 'Enter 6-character code';
      return;
    }

    this.multiState = 'connecting';
    this.statusMessage = 'Joining game...';
    this.errorMessage = '';

    try {
      this.session = await gameSessionService.joinByInviteCode(this.inviteCodeInput);
      this.isHost = false;
      await this.setupSession();
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Invalid code';
      this.multiState = 'menu';
      this.showInviteInput = true;
    }
  }

  private async setupSession(): Promise<void> {
    if (!this.session) return;

    // Clear any existing polling
    this.stopPolling();

    gameSessionService.subscribeToSession(this.session.id, {
      onSessionUpdate: (session) => {
        this.session = session;

        if (session.status === 'playing' && this.multiState !== 'playing') {
          this.stopPolling();
          this.startGame();
        }

        if (session.status === 'finished' || session.status === 'abandoned') {
          this.stopPolling();
          this.endGame();
        }
      },
      onMoveReceived: (move) => {
        this.handleOpponentMove(move);
      },
      onOpponentJoined: () => {
        this.stopPolling();
        this.startGame();
      },
      onOpponentLeft: () => {
        this.statusMessage = 'Opponent disconnected';
        this.endGame();
      },
    });

    // Start polling as fallback (in case Realtime doesn't work)
    console.log('[MP] setupSession - isHost:', this.isHost, 'multiState:', this.multiState);
    if (this.isHost && this.multiState === 'waiting') {
      this.startPolling();
    } else {
      console.log('[MP] NOT starting polling');
    }

    // If session already has opponent, start immediately
    if (this.session.guestId && this.session.status === 'playing') {
      this.stopPolling();
      this.startGame();
    }
  }

  private startPolling(): void {
    console.log('[MP] Starting polling, isHost:', this.isHost, 'multiState:', this.multiState);

    // Poll every 2 seconds as fallback for Realtime
    this.pollingInterval = setInterval(async () => {
      if (!this.session || this.multiState !== 'waiting') {
        console.log('[MP] Stopping poll - session:', !!this.session, 'state:', this.multiState);
        this.stopPolling();
        return;
      }

      try {
        console.log('[MP] Polling session:', this.session.id);
        const updated = await gameSessionService.getSession(this.session.id);
        console.log('[MP] Poll result - guestId:', updated.guestId, 'status:', updated.status);

        if (updated.guestId && updated.status === 'playing') {
          console.log('[MP] Guest joined! Starting game...');
          this.session = updated;
          this.stopPolling();
          this.startGame();
        }
      } catch (err) {
        console.error('[MP] Polling error:', err);
      }
    }, 2000);
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private startGame(): void {
    this.multiState = 'playing';
    this.state = 'playing';
    this.resetGame();
    this.statusMessage = '';

    // Host serves first
    this.servingPlayer = this.isHost ? 'me' : 'opponent';
    this.serveDelay = 1500;
  }

  private endGame(): void {
    this.multiState = 'finished';
    this.state = 'gameover';
  }

  private handleOpponentMove(move: GameMove): void {
    const data = move.moveData as unknown as PongMove;

    switch (data.type) {
      case 'paddle_move':
        if (data.paddleY !== undefined) {
          this.opponentPaddle.y = data.paddleY;
        }
        break;

      case 'ball_sync':
        // Only accept ball sync from host
        if (!this.isHost && data.ball) {
          this.ball.x = data.ball.x;
          this.ball.y = data.ball.y;
          this.ball.vx = data.ball.vx;
          this.ball.vy = data.ball.vy;
        }
        break;

      case 'score_update':
        if (data.hostScore !== undefined && data.guestScore !== undefined) {
          if (this.isHost) {
            this.myScore = data.hostScore;
            this.opponentScore = data.guestScore;
          } else {
            this.myScore = data.guestScore;
            this.opponentScore = data.hostScore;
          }
        }
        break;
    }
  }

  private async sendPaddleMove(): Promise<void> {
    const move: PongMove = {
      type: 'paddle_move',
      paddleY: this.myPaddle.y,
      timestamp: Date.now(),
    };
    await gameSessionService.sendMove(move);
  }

  private async syncBallState(): Promise<void> {
    if (!this.isHost) return;

    const now = Date.now();
    if (now - this.lastSyncTime < this.SYNC_INTERVAL) return;
    this.lastSyncTime = now;

    const move: PongMove = {
      type: 'ball_sync',
      ball: {
        x: this.ball.x,
        y: this.ball.y,
        vx: this.ball.vx,
        vy: this.ball.vy,
      },
      timestamp: now,
    };
    await gameSessionService.sendMove(move);
  }

  private async syncScore(): Promise<void> {
    const move: PongMove = {
      type: 'score_update',
      hostScore: this.isHost ? this.myScore : this.opponentScore,
      guestScore: this.isHost ? this.opponentScore : this.myScore,
      timestamp: Date.now(),
    };
    await gameSessionService.sendMove(move);
  }

  update(deltaTime: number): void {
    if (this.multiState !== 'playing') return;

    // Serve delay
    if (this.serveDelay > 0) {
      this.serveDelay -= deltaTime;
      if (this.serveDelay <= 0) {
        this.serveBall();
      }
      return;
    }

    // Update my paddle
    let paddleMoved = false;
    if (this.upPressed) {
      this.myPaddle.y -= this.myPaddle.speed;
      paddleMoved = true;
    }
    if (this.downPressed) {
      this.myPaddle.y += this.myPaddle.speed;
      paddleMoved = true;
    }
    this.myPaddle.y = Math.max(0, Math.min(this.height - this.myPaddle.height, this.myPaddle.y));

    if (paddleMoved) {
      this.sendPaddleMove();
    }

    // Update ball (host controls ball physics)
    if (this.isHost || this.ball.vx !== 0) {
      this.ball.x += this.ball.vx;
      this.ball.y += this.ball.vy;

      // Ball trail
      this.ballTrail.unshift({ x: this.ball.x, y: this.ball.y, alpha: 1 });
      if (this.ballTrail.length > 4) {
        this.ballTrail.pop();
      }
      this.ballTrail.forEach((t, i) => {
        t.alpha = 1 - (i / this.ballTrail.length);
      });

      // Wall collisions
      if (this.ball.y <= 0 || this.ball.y + this.ball.size >= this.height) {
        this.ball.vy *= -1;
        this.ball.y = Math.max(0, Math.min(this.height - this.ball.size, this.ball.y));
      }

      // Paddle collisions (host calculates)
      if (this.isHost) {
        this.checkPaddleCollisions();
        this.checkScoring();
        this.syncBallState();
      }
    }
  }

  private checkPaddleCollisions(): void {
    // Left paddle (host)
    const leftPaddle = this.isHost ? this.myPaddle : this.opponentPaddle;
    const rightPaddle = this.isHost ? this.opponentPaddle : this.myPaddle;

    const leftX = this.PADDLE_OFFSET;
    const rightX = this.width - this.PADDLE_OFFSET - this.PADDLE_WIDTH;

    // Left paddle collision
    if (this.ball.vx < 0 &&
        this.ball.x <= leftX + this.PADDLE_WIDTH &&
        this.ball.x + this.ball.size >= leftX &&
        this.ball.y + this.ball.size >= leftPaddle.y &&
        this.ball.y <= leftPaddle.y + leftPaddle.height) {
      this.handlePaddleCollision(leftPaddle, leftX, 1);
    }

    // Right paddle collision
    if (this.ball.vx > 0 &&
        this.ball.x + this.ball.size >= rightX &&
        this.ball.x <= rightX + this.PADDLE_WIDTH &&
        this.ball.y + this.ball.size >= rightPaddle.y &&
        this.ball.y <= rightPaddle.y + rightPaddle.height) {
      this.handlePaddleCollision(rightPaddle, rightX, -1);
    }
  }

  private handlePaddleCollision(paddle: Paddle, paddleX: number, direction: number): void {
    const hitY = this.ball.y + this.ball.size / 2 - paddle.y;
    const relativeHit = hitY / paddle.height;
    const angle = (relativeHit - 0.5) * 120;
    const angleRad = (angle * Math.PI) / 180;

    this.ball.speed = Math.min(this.MAX_BALL_SPEED, this.ball.speed + 0.5);
    this.ball.vx = Math.cos(angleRad) * this.ball.speed * direction;
    this.ball.vy = Math.sin(angleRad) * this.ball.speed;

    if (direction > 0) {
      this.ball.x = paddleX + this.PADDLE_WIDTH;
    } else {
      this.ball.x = paddleX - this.ball.size;
    }
  }

  private async checkScoring(): Promise<void> {
    // Ball out left (right player scores)
    if (this.ball.x < -this.ball.size) {
      // Guest scores
      if (this.isHost) {
        this.opponentScore++;
      } else {
        this.myScore++;
      }
      await this.handleScore('guest');
    }
    // Ball out right (left player scores)
    else if (this.ball.x > this.width + this.ball.size) {
      // Host scores
      if (this.isHost) {
        this.myScore++;
      } else {
        this.opponentScore++;
      }
      await this.handleScore('host');
    }
  }

  private async handleScore(scorer: 'host' | 'guest'): Promise<void> {
    await this.syncScore();
    this.resetBall();

    const WIN_SCORE = this.session?.maxScore ?? 11;
    const hostScore = this.isHost ? this.myScore : this.opponentScore;
    const guestScore = this.isHost ? this.opponentScore : this.myScore;

    // Check for win (must win by 2)
    if ((hostScore >= WIN_SCORE || guestScore >= WIN_SCORE) &&
        Math.abs(hostScore - guestScore) >= 2) {
      await gameSessionService.finishGame(hostScore, guestScore);
      return;
    }

    // Next serve
    this.servingPlayer = scorer === 'host'
      ? (this.isHost ? 'opponent' : 'me')
      : (this.isHost ? 'me' : 'opponent');
    this.serveDelay = 1000;
  }

  render(): void {
    this.draw.clear(this.width, this.height);

    switch (this.multiState) {
      case 'menu':
        this.renderMenu();
        break;
      case 'searching':
      case 'waiting':
      case 'connecting':
        this.renderWaiting();
        break;
      case 'playing':
        this.renderGame();
        break;
      case 'finished':
        this.renderGame();
        this.renderGameOver();
        break;
    }
  }

  private renderMenu(): void {
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    this.draw.textCentered('FUSION LAB ARCADE', centerX, centerY - 140, 20);
    this.draw.textCentered('─────────────────', centerX, centerY - 110, 14);
    this.draw.textCentered('DUAL AXIS ONLINE', centerX, centerY - 70, 28);
    this.draw.textCentered('Real-time Multiplayer', centerX, centerY - 35, 14);

    if (this.showInviteInput) {
      this.draw.textCentered('Enter invite code:', centerX, centerY + 20, 16);
      this.draw.rect(centerX - 80, centerY + 40, 160, 40, 2);
      this.draw.textCentered(
        this.inviteCodeInput.padEnd(6, '_'),
        centerX,
        centerY + 55,
        24
      );
      this.draw.textCentered('[ENTER] Join  [ESC] Back', centerX, centerY + 100, 14);
    } else {
      this.draw.textCentered('[1] Quick Match', centerX, centerY + 20, 18);
      this.draw.textCentered('[2] Create Private Game', centerX, centerY + 55, 18);
      this.draw.textCentered('[3] Join with Code', centerX, centerY + 90, 18);
    }

    if (this.errorMessage) {
      this.ctx.fillStyle = '#FF4444';
      this.draw.textCentered(this.errorMessage, centerX, centerY + 140, 14);
      this.ctx.fillStyle = '#FFFFFF';
    }

    if (!this.myUserId) {
      this.draw.textCentered('⚠ Login required for multiplayer', centerX, this.height - 40, 12);
    }
  }

  private renderWaiting(): void {
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    this.draw.textCentered('DUAL AXIS ONLINE', centerX, centerY - 80, 28);

    // Animated dots
    const dots = '.'.repeat((Math.floor(Date.now() / 500) % 4));
    this.draw.textCentered(this.statusMessage + dots, centerX, centerY, 18);

    if (this.session?.inviteCode) {
      this.draw.rect(centerX - 100, centerY + 40, 200, 60, 2);
      this.draw.textCentered('INVITE CODE', centerX, centerY + 55, 12);
      this.draw.textCentered(this.session.inviteCode, centerX, centerY + 80, 28);
    }

    this.draw.textCentered('[ESC] Cancel', centerX, this.height - 40, 14);
  }

  private renderGame(): void {
    // Draw boundaries
    this.draw.line(0, 0, this.width, 0, 2);
    this.draw.line(0, this.height, this.width, this.height, 2);

    // Draw center line
    this.draw.dashedLine(this.width / 2, 0, this.width / 2, this.height, [20, 10], 2);

    // Draw paddles
    const myX = this.isHost ? this.PADDLE_OFFSET : this.width - this.PADDLE_OFFSET - this.PADDLE_WIDTH;
    const opponentX = this.isHost ? this.width - this.PADDLE_OFFSET - this.PADDLE_WIDTH : this.PADDLE_OFFSET;

    this.renderPaddle(myX, this.myPaddle.y, true);
    this.renderPaddle(opponentX, this.opponentPaddle.y, false);

    // Draw ball trail
    for (let i = this.ballTrail.length - 1; i >= 0; i--) {
      const trail = this.ballTrail[i];
      this.ctx.save();
      this.ctx.globalAlpha = trail.alpha * 0.3;
      this.draw.rectFilled(trail.x, trail.y, this.ball.size, this.ball.size);
      this.ctx.restore();
    }

    // Draw ball
    this.draw.rect(this.ball.x, this.ball.y, this.ball.size, this.ball.size, 2);

    // Draw scores
    const leftScore = this.isHost ? this.myScore : this.opponentScore;
    const rightScore = this.isHost ? this.opponentScore : this.myScore;

    this.draw.text(`${leftScore}`, this.width / 2 - 60, 40, 32, 'center', 'top');
    this.draw.text(':', this.width / 2, 40, 32, 'center', 'top');
    this.draw.text(`${rightScore}`, this.width / 2 + 60, 40, 32, 'center', 'top');

    // Player labels
    const myName = this.session?.host?.fullName ?? 'You';
    const opponentName = this.isHost
      ? (this.session?.guest?.fullName ?? 'Opponent')
      : (this.session?.host?.fullName ?? 'Opponent');

    const leftName = this.isHost ? myName : opponentName;
    const rightName = this.isHost ? opponentName : myName;

    this.draw.text(leftName.substring(0, 12), 10, this.height - 25, 10);
    this.draw.text(rightName.substring(0, 12), this.width - 10, this.height - 25, 10, 'right');

    // Connection indicator
    this.ctx.fillStyle = '#00FF00';
    this.ctx.beginPath();
    this.ctx.arc(this.width - 15, 15, 5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#FFFFFF';
  }

  private renderPaddle(x: number, y: number, isMe: boolean): void {
    this.draw.rect(x, y, this.PADDLE_WIDTH, this.PADDLE_HEIGHT, 2);

    // Highlight my paddle
    if (isMe) {
      this.ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
      this.ctx.fillRect(x, y, this.PADDLE_WIDTH, this.PADDLE_HEIGHT);
      this.ctx.fillStyle = '#FFFFFF';
    }

    // Measurement lines
    for (let i = 1; i < 3; i++) {
      const lineY = y + (i * this.PADDLE_HEIGHT) / 3;
      this.draw.line(x, lineY, x + this.PADDLE_WIDTH, lineY, 1);
    }
  }

  private renderGameOver(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    const iWon = this.myScore > this.opponentScore;
    const result = iWon ? 'VICTORY!' : 'DEFEAT';

    this.draw.textCentered(result, centerX, centerY - 80, 32);
    this.draw.textCentered('─────────────', centerX, centerY - 45, 14);

    const hostScore = this.isHost ? this.myScore : this.opponentScore;
    const guestScore = this.isHost ? this.opponentScore : this.myScore;

    this.draw.textCentered(
      `Final: ${hostScore} : ${guestScore}`,
      centerX,
      centerY,
      24
    );

    // XP earned
    const xpEarned = this.isHost
      ? (this.session?.hostXpEarned ?? 0)
      : (this.session?.guestXpEarned ?? 0);

    if (xpEarned > 0) {
      this.ctx.fillStyle = '#00FF00';
      this.draw.textCentered(`+${xpEarned} XP`, centerX, centerY + 40, 20);
      this.ctx.fillStyle = '#FFFFFF';
    }

    this.draw.textCentered('[SPACE] Play again', centerX, centerY + 90, 16);
    this.draw.textCentered('[ESC] Back to menu', centerX, centerY + 120, 14);
  }

  handleKeyDown(event: KeyboardEvent): void {
    const key = event.key;

    // Menu navigation
    if (this.multiState === 'menu') {
      if (this.showInviteInput) {
        if (key === 'Escape') {
          this.showInviteInput = false;
          this.inviteCodeInput = '';
          this.errorMessage = '';
          return;
        }
        if (key === 'Enter') {
          this.joinWithCode();
          return;
        }
        if (key === 'Backspace') {
          this.inviteCodeInput = this.inviteCodeInput.slice(0, -1);
          return;
        }
        if (/^[a-zA-Z0-9]$/.test(key) && this.inviteCodeInput.length < 6) {
          this.inviteCodeInput += key.toUpperCase();
          return;
        }
        return;
      }

      if (key === '1') {
        this.createQuickMatch();
        return;
      }
      if (key === '2') {
        this.createPrivateGame();
        return;
      }
      if (key === '3') {
        this.showInviteInput = true;
        this.inviteCodeInput = '';
        return;
      }
    }

    // Cancel waiting/searching
    if ((this.multiState === 'waiting' || this.multiState === 'searching') && key === 'Escape') {
      gameSessionService.leaveSession();
      this.multiState = 'menu';
      this.session = null;
      return;
    }

    // Game over actions
    if (this.multiState === 'finished') {
      if (key === ' ') {
        this.createQuickMatch();
        return;
      }
      if (key === 'Escape') {
        this.multiState = 'menu';
        this.session = null;
        return;
      }
    }

    // Playing controls
    if (this.multiState === 'playing') {
      if (key === 'w' || key === 'W' || key === 'ArrowUp') {
        this.upPressed = true;
      }
      if (key === 's' || key === 'S' || key === 'ArrowDown') {
        this.downPressed = true;
      }
      if (key === 'Escape') {
        gameSessionService.leaveSession();
        this.multiState = 'menu';
        this.session = null;
      }
    }
  }

  handleKeyUp(event: KeyboardEvent): void {
    const key = event.key;

    if (key === 'w' || key === 'W' || key === 'ArrowUp') {
      this.upPressed = false;
    }
    if (key === 's' || key === 'S' || key === 'ArrowDown') {
      this.downPressed = false;
    }
  }

  getState(): GameState {
    return this.state;
  }

  getScore(): GameScore {
    return this.score;
  }
}
