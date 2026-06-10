import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

type FieldError = 'email' | 'password' | 'name' | 'alias' | 'avatar' | 'general' | null;

interface Avatar {
  key:   string;
  emoji: string;
  label: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  step = 1;

  // Paso 1
  email    = '';
  password = '';
  showPassword = false;

  // Paso 2
  name           = '';
  alias          = '';
  selectedAvatar = 'ball';

  // Estado
  isLoading    = false;
  fieldError: FieldError = null;
  errorMessage = '';

  // userId guardado entre pasos
  private createdUserId: number | null = null;

  // Avatares predefinidos
  // El campo `key` es lo que se manda como `icon` al backend
  // Ajusta los valores según lo que acepte tu backend
  readonly AVATARS: Avatar[] = [
    { key: 'ball',     emoji: '⚽', label: 'Balón' },
    { key: 'trophy',   emoji: '🏆', label: 'Trofeo' },
    { key: 'star',     emoji: '⭐', label: 'Estrella' },
    { key: 'fire',     emoji: '🔥', label: 'Fuego' },
    { key: 'lion',     emoji: '🦁', label: 'León' },
    { key: 'eagle',    emoji: '🦅', label: 'Águila' },
    { key: 'rocket',   emoji: '🚀', label: 'Cohete' },
    { key: 'lightning',emoji: '⚡', label: 'Rayo' },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  // ── Paso 1: crear usuario ────────────────────────────────
  onStep1Submit(): void {
    this._clearErrors();

    if (!this.email.trim()) {
      this._setError('email', 'Ingresa tu correo.');
      return;
    }
    if (!this.password) {
      this._setError('password', 'Ingresa una contraseña.');
      return;
    }

    this.isLoading = true;

    this.authService.createUser(this.email.trim(), this.password).subscribe({
      next: (res) => {
        this.isLoading = false;
        // El backend retorna el userId — ajusta el campo según la respuesta real
        this.createdUserId = (res['userId'] ?? res['user_id'] ?? res['id']) as number;
        this.step = 2;
      },
      error: (err: Error) => {
        this.isLoading = false;
        const msg = err?.message ?? 'Error al crear la cuenta.';
        if (msg.toLowerCase().includes('correo')) {
          this._setError('email', msg);
        } else if (msg.toLowerCase().includes('contraseña')) {
          this._setError('password', msg);
        } else {
          this._setError('general', msg);
        }
      }
    });
  }

  // ── Paso 2: crear perfil ─────────────────────────────────
  onStep2Submit(): void {
    this._clearErrors();

    if (!this.name.trim()) {
      this._setError('name', 'Ingresa tu nombre.');
      return;
    }
    if (!this.alias.trim()) {
      this._setError('alias', 'Ingresa un alias.');
      return;
    }
    if (!this.selectedAvatar) {
      this._setError('avatar', 'Elige un avatar.');
      return;
    }

    if (!this.createdUserId) {
      this._setError('general', 'Sesión inválida. Vuelve al paso anterior.');
      return;
    }

    this.isLoading = true;

    this.authService.createProfile(
      this.createdUserId,
      this.name.trim(),
      this.alias.trim(),
      this.selectedAvatar
    ).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/login'], {
          queryParams: { registered: 'true' }
        });
      },
      error: (err: Error) => {
        this.isLoading = false;
        this._setError('general', err?.message ?? 'Error al crear el perfil.');
      }
    });
  }

  private _setError(field: FieldError, message: string): void {
    this.fieldError   = field;
    this.errorMessage = message;
  }

  private _clearErrors(): void {
    this.fieldError   = null;
    this.errorMessage = '';
  }
}
