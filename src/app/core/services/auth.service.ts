import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, map, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthSession, LoginType } from '../models/domain.models';

const SESSION_KEY = 'mp_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  static readonly LOGIN_TYPE_USERNAME: number = LoginType.USERNAME;
  static readonly LOGIN_TYPE_EMAIL:    number = LoginType.EMAIL;

  private readonly baseUrl = environment.apiUrl;

  private _session = signal<AuthSession | null>(this._loadSession());

  readonly session  = this._session.asReadonly();
  readonly isLoggedIn = computed(() => this._session() !== null);
  readonly isAdmin    = computed(() => this._session()?.role === 'ROLE_ADMIN');
  readonly currentUser = computed(() => this._session());

  constructor(private http: HttpClient, private router: Router) {}

  loginWithUsername(username: string, password: string): Observable<AuthSession> {
    const params = new HttpParams()
      .set('loginType', AuthService.LOGIN_TYPE_USERNAME)
      .set('loginValue', username);

    return this.http
      .get<Record<string, unknown>>(`${this.baseUrl}/user/get-user-for-login`, { params })
      .pipe(
        map(res => this._validateAndMapSession(res, password)),
        tap(session => this._persistSession(session)),
        catchError(err => throwError(() => err))
      );
  }

  loginWithEmail(email: string, password: string): Observable<AuthSession> {
    const params = new HttpParams()
      .set('loginType', AuthService.LOGIN_TYPE_EMAIL)
      .set('loginValue', email);

    return this.http
      .get<Record<string, unknown>>(`${this.baseUrl}/user/get-user-for-login`, { params })
      .pipe(
        map(res => this._validateAndMapSession(res, password)),
        tap(session => this._persistSession(session)),
        catchError(err => throwError(() => err))
      );
  }

  createUser(email: string, password: string): Observable<Record<string, unknown>> {
    const params = new HttpParams()
      .set('email', email)
      .set('password', password);

    // POST con RequestParam -> body en null
    return this.http.post<Record<string, unknown>>(
      `${this.baseUrl}/user/create-user`, null, { params }
    );
  }

  createProfile(userId: number, name: string, alias: string, icon: string): Observable<Record<string, unknown>> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('name', name)
      .set('alias', alias)
      .set('icon', icon);

    // POST con RequestParam -> body en null
    return this.http.post<Record<string, unknown>>(
      `${this.baseUrl}/user/create-user-profile`, null, { params }
    );
  }

  changePassword(userId: number, oldPassword: string, newPassword: string): Observable<Record<string, unknown>> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('oldPassword', oldPassword)
      .set('newPassword', newPassword);

    return this.http.put<Record<string, unknown>>(
      `${this.baseUrl}/user/change-password`, null, { params }
    );
  }

  getUserById(userId: number): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.baseUrl}/user/${userId}`);
  }

  getAllUsers(): Observable<Record<string, unknown>[]> {
    return this.http.get<Record<string, unknown>[]>(`${this.baseUrl}/user/all-users`);
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    this._session.set(null);
    this.router.navigate(['/login']);
  }

  private _validateAndMapSession(res: Record<string, unknown>, password: string): AuthSession {
    if (res['status'] === 'ERROR' || !res) {
      throw new Error((res['message'] as string) ?? 'Usuario no encontrado');
    }
    
    // Validar contraseña
    const resPassword = res['password'] as string;
    if (resPassword && resPassword !== password) {
       throw new Error('Contraseña incorrecta');
    }

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
