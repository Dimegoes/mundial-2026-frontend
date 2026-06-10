import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

type LoginMode  = 'email' | 'username';
type FieldError = 'email' | 'username' | 'password' | 'general' | null;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  // ── Estado del formulario ────────────────────────────────
  loginMode: LoginMode = 'email';

  emailValue    = '';
  usernameValue = '';
  passwordValue = '';
  showPassword  = false;

  isLoading    = false;
  hasError     = false;
  fieldError: FieldError = null;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  toggleMode(): void {
    this.loginMode = this.loginMode === 'email' ? 'username' : 'email';
    this._clearErrors();
  }

  onSubmit(): void {
    this._clearErrors();

    // Validación básica frontend
    if (this.loginMode === 'email') {
      if (!this.emailValue.trim()) {
        this._setError('email', 'Ingresa tu correo electrónico.');
        return;
      }
    } else {
      if (!this.usernameValue.trim()) {
        this._setError('username', 'Ingresa tu usuario.');
        return;
      }
    }

    if (!this.passwordValue) {
      this._setError('password', 'Ingresa tu contraseña.');
      return;
    }

    this.isLoading = true;

    const login$ = this.loginMode === 'email'
      ? this.authService.loginWithEmail(this.emailValue.trim(), this.passwordValue)
      : this.authService.loginWithUsername(this.usernameValue.trim(), this.passwordValue);

    login$.subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err: Error) => {
        this.isLoading = false;
        const msg = err?.message ?? 'Credenciales incorrectas. Intenta de nuevo.';
        // Mapeamos mensajes del backend a campos específicos
        if (msg.toLowerCase().includes('contraseña')) {
          this._setError('password', 'Contraseña incorrecta');
        } else if (msg.toLowerCase().includes('correo') || msg.toLowerCase().includes('usuario')) {
          this._setError(this.loginMode === 'email' ? 'email' : 'username', msg);
        } else {
          this._setError('general', msg);
        }
        this._triggerShake();
      }
    });
  }

  private _setError(field: FieldError, message: string): void {
    this.fieldError   = field;
    this.errorMessage = message;
    this.hasError     = true;
  }

  private _clearErrors(): void {
    this.fieldError   = null;
    this.errorMessage = '';
    this.hasError     = false;
  }

  private _triggerShake(): void {
    this.hasError = true;
    setTimeout(() => { this.hasError = false; }, 600);
  }
}
