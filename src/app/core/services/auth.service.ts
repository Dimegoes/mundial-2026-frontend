import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, map, catchError, throwError, of, delay } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthSession, LoginType } from '../models/domain.models';

const SESSION_KEY = 'mp_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // ── Tipos de login — ajusta aquí si el backend usa valores distintos
  static readonly LOGIN_TYPE_USERNAME: number = LoginType.USERNAME; // 1
  static readonly LOGIN_TYPE_EMAIL:    number = LoginType.EMAIL;    // 2

  private readonly baseUrl = environment.apiUrl;

  // ── Señales reactivas de sesión ──────────────────────────
  private _session = signal<AuthSession | null>(this._loadSession());

  readonly session  = this._session.asReadonly();
  readonly isLoggedIn = computed(() => this._session() !== null);
  readonly isAdmin    = computed(() => this._session()?.role === 'ROLE_ADMIN');
  readonly currentUser = computed(() => this._session());

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  // ── Login con username ───────────────────────────────────
  loginWithUsername(username: string, password: string): Observable<AuthSession> {
    if (username === 'admin' && password === 'admin123') {
      const mockSession: AuthSession = {
        userId: 1, email: 'admin@mundial.com', username: 'admin',
        alias: 'Super Admin', icon: '👑', role: 'ROLE_ADMIN', loggedAt: Date.now()
      };
      return of(mockSession).pipe(
        delay(800),
        tap(session => this._persistSession(session))
      );
    }
    return throwError(() => new Error('Credenciales incorrectas (Usa: admin / admin123)')).pipe(delay(500));
  }

  // ── Login con email ──────────────────────────────────────
  loginWithEmail(email: string, password: string): Observable<AuthSession> {
    if (email === 'admin@mundial.com' && password === 'admin123') {
      const mockSession: AuthSession = {
        userId: 1, email: 'admin@mundial.com', username: 'admin',
        alias: 'Super Admin', icon: '👑', role: 'ROLE_ADMIN', loggedAt: Date.now()
      };
      return of(mockSession).pipe(
        delay(800),
        tap(session => this._persistSession(session))
      );
    }
    return throwError(() => new Error('Credenciales incorrectas (Usa: admin@mundial.com / admin123)')).pipe(delay(500));
  }

  // ── Registro paso 1: crear cuenta ───────────────────────
  createUser(email: string, password: string): Observable<Record<string, unknown>> {
    const params = new HttpParams()
      .set('email', email)
      .set('password', password);

    return this.http.post<Record<string, unknown>>(
      `${this.baseUrl}/user/create-user`, null, { params }
    );
  }

  // ── Registro paso 2: crear perfil ───────────────────────
  createProfile(
    userId: number,
    name: string,
    alias: string,
    icon: string
  ): Observable<Record<string, unknown>> {
    const params = new HttpParams()
      .set('userId', userId)
      .set('name', name)
      .set('alias', alias)
      .set('icon', icon);

    return this.http.post<Record<string, unknown>>(
      `${this.baseUrl}/user/create-user-profile`, null, { params }
    );
  }

  // ── Logout ───────────────────────────────────────────────
  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    this._session.set(null);
    this.router.navigate(['/login']);
  }

  // ── Privados ─────────────────────────────────────────────

  /**
   * Mapea la respuesta del backend a AuthSession.
   * NOTA: Ajusta los nombres de campo según lo que retorne tu backend.
   * La validación de password se hace contra el campo que retorne el backend.
   * Por ahora comparamos texto plano — adaptar cuando el backend use hash.
   */
  private _validateAndMapSession(
    res: Record<string, unknown>,
    _password: string
  ): AuthSession {
    // El backend retorna status ERROR en 200 también (patrón del controller)
    if (res['status'] === 'ERROR') {
      throw new Error((res['message'] as string) ?? 'Credenciales incorrectas');
    }

    // Adapta los campos aquí según lo que retorne get-user-for-login
    const session: AuthSession = {
      userId:   (res['userId'] ?? res['user_id'] ?? res['id']) as number,
      email:    res['email'] as string | undefined,
      username: res['username'] as string | undefined,
      alias:    res['alias'] as string | undefined,
      icon:     res['icon'] as string | undefined,
      role:     (res['role'] ?? 'ROLE_USER') as 'ROLE_USER' | 'ROLE_ADMIN',
      loggedAt: Date.now(),
    };

    return session;
  }

  private _persistSession(session: AuthSession): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this._session.set(session);
  }

  private _loadSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) return JSON.parse(raw) as AuthSession;
      return null;
    } catch {
      return null;
    }
  }
}
