import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

export interface Organization {
  _id?: string;
  name: string;
  members: Member[];
  created_at?: Date;
}

export interface Member {
  _id?: string;
  username: string;
  email: string;
  organization_role?: 'chef' | 'membre';
}

export interface UserOrganizationState {
  organizationId: string | null;
  organizationName: string | null;
  hasOrganization: boolean;
}

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private API_URL = `${environment.apiUrl}/organization`;

  private userOrganizationState = new BehaviorSubject<UserOrganizationState>({
    organizationId: null,
    organizationName: null,
    hasOrganization: false
  });

  public userOrganization$ = this.userOrganizationState.asObservable();

  private handleError(error: any) {
    console.error('Organization Service Error:', error);
    
    if (error.status === 401) {
      return throwError(() => 'Non autorisé');
    } else if (error.status === 403) {
      return throwError(() => 'Accès refusé');
    } else if (error.status === 404) {
      return throwError(() => 'Organisation non trouvée');
    }
    
    return throwError(() => error.error?.message || 'Erreur serveur');
  }

  private canManage(org: Organization): boolean {
    if (!org?.members) return false;
    
    const userId = this.auth.getUserId();
    const role = this.auth.getRole();
    
    if (!userId) return false;
    
    return (
      role === 'admin' ||
      org.members.some(m => m._id === userId && m.organization_role === 'chef')
    );
  }

  private validateOrganizationName(name: string): string {
    if (!name || typeof name !== 'string') {
      throw new Error('Le nom est requis');
    }
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      throw new Error('Le nom doit contenir au moins 2 caractères');
    }
    if (trimmedName.length > 50) {
      throw new Error('Le nom ne peut pas dépasser 50 caractères');
    }
    return trimmedName;
  }

  private validateEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      throw new Error('Email requis');
    }
    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      throw new Error('Email invalide');
    }
    return trimmedEmail;
  }

  private validateObjectId(id: string, fieldName: string = 'ID'): void {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error(`${fieldName} requis`);
    }
    if (!/^[0-9a-fA-F]{24}$/.test(id.trim())) {
      throw new Error(`${fieldName} invalide`);
    }
  }

  private updateUserOrganizationState(org: Organization | null): void {
    // Utiliser les informations du token si disponibles, sinon utiliser org
    const state: UserOrganizationState = {
      organizationId: this.auth.getOrganizationId() || org?._id || null,
      organizationName: this.auth.getOrganizationName() || org?.name || null,
      hasOrganization: this.auth.hasOrganization() || !!org
    };
    this.userOrganizationState.next(state);
  }

  loadUserOrganizationState(): void {
    // Charger directement depuis le token si possible
    if (this.auth.hasOrganization()) {
      this.updateUserOrganizationState(null);
    } else {
      // Fallback vers l'API si pas d'info dans le token
      this.getMyOrganization().subscribe({
        next: (org) => this.updateUserOrganizationState(org),
        error: () => this.updateUserOrganizationState(null)
      });
    }
  }

  createOrganization(name: string): Observable<{ message: string; organization: Organization; token?: string }> {
    try {
      const validatedName = this.validateOrganizationName(name);
      return this.http.post<{ message: string; organization: Organization; token?: string }>(`${this.API_URL}`, { name: validatedName })
        .pipe(
          tap(response => {
            if (response.token) {
              localStorage.setItem('token', response.token);
            }
            this.updateUserOrganizationState(response.organization);
          }),
          catchError(this.handleError)
        );
    } catch (error) {
      return throwError(() => (error as Error).message);
    }
  }

  getOrganizationById(id: string): Observable<Organization> {
    try {
      this.validateObjectId(id, "ID d'organisation");
      return this.http.get<Organization>(`${this.API_URL}/${id.trim()}`)
        .pipe(catchError(this.handleError));
    } catch (error) {
      return throwError(() => (error as Error).message);
    }
  }

  getMyOrganization(): Observable<Organization> {
    return this.http.get<Organization>(`${this.API_URL}/me`)
      .pipe(catchError(this.handleError));
  }

  inviteToOrganization(orgId: string, email: string): Observable<{ message: string }> {
    try {
      this.validateObjectId(orgId, "ID d'organisation");
      const validatedEmail = this.validateEmail(email);
      
      return this.http.put<{ message: string }>(`${this.API_URL}/${orgId.trim()}/invite`, { email: validatedEmail })
        .pipe(catchError(this.handleError));
    } catch (error) {
      return throwError(() => (error as Error).message);
    }
  }

  inviteToMyOrganization(email: string): Observable<{ message: string }> {
    try {
      const validatedEmail = this.validateEmail(email);
      
      return this.http.put<{ message: string }>(`${this.API_URL}/invite`, { email: validatedEmail })
        .pipe(catchError(this.handleError));
    } catch (error) {
      return throwError(() => (error as Error).message);
    }
  }

  updateOrganizationName(orgId: string, name: string): Observable<{ message: string; organization: Organization }> {
    try {
      this.validateObjectId(orgId, "ID d'organisation");
      const validatedName = this.validateOrganizationName(name);
      
      return this.http.put<{ message: string; organization: Organization }>(`${this.API_URL}/${orgId.trim()}`, { name: validatedName })
        .pipe(
          tap(response => this.updateUserOrganizationState(response.organization)),
          catchError(this.handleError)
        );
    } catch (error) {
      return throwError(() => (error as Error).message);
    }
  }

  updateMyOrganizationName(name: string): Observable<{ message: string; organization: Organization }> {
    try {
      const validatedName = this.validateOrganizationName(name);
      
      return this.http.put<{ message: string; organization: Organization }>(`${this.API_URL}`, { name: validatedName })
        .pipe(catchError(this.handleError));
    } catch (error) {
      return throwError(() => (error as Error).message);
    }
  }

  deleteOrganization(orgId: string): Observable<{ message: string; token?: string }> {
    try {
      this.validateObjectId(orgId, "ID d'organisation");
      
      return this.http.delete<{ message: string; token?: string }>(`${this.API_URL}/${orgId.trim()}`)
        .pipe(
          tap((response) => {
            if (response.token) {
              localStorage.setItem('token', response.token);
            }
            this.updateUserOrganizationState(null);
          }),
          catchError(this.handleError)
        );
    } catch (error) {
      return throwError(() => (error as Error).message);
    }
  }

  deleteMyOrganization(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}`)
      .pipe(catchError(this.handleError));
  }

  leaveOrganization(): Observable<{ message: string; token?: string }> {
    return this.http.put<{ message: string; token?: string }>(`${this.API_URL}/leave`, {})
      .pipe(
        tap((response) => {
          if (response.token) {
            localStorage.setItem('token', response.token);
          }
          this.updateUserOrganizationState(null);
        }),
        catchError(this.handleError)
      );
  }

  removeMember(orgId: string, memberId: string): Observable<{ message: string }> {
    try {
      this.validateObjectId(orgId, "ID d'organisation");
      this.validateObjectId(memberId, "ID du membre");
      
      return this.http.delete<{ message: string }>(`${this.API_URL}/${orgId.trim()}/members/${memberId.trim()}`)
        .pipe(catchError(this.handleError));
    } catch (error) {
      return throwError(() => (error as Error).message);
    }
  }

  isChef(org: Organization, userId: string): boolean {
    if (!org?.members || !userId) return false;
    return org.members.some(m => m._id === userId && m.organization_role === 'chef');
  }

  isMember(org: Organization, userId: string): boolean {
    if (!org?.members || !userId) return false;
    return org.members.some(m => m._id === userId);
  }

  canInvite(org: Organization): boolean {
    return this.canManage(org);
  }

  canUpdateName(org: Organization): boolean {
    return this.canManage(org);
  }

  canDelete(org: Organization): boolean {
    return this.canManage(org);
  }

  canRemoveMember(org: Organization, memberId: string): boolean {
    if (!this.canManage(org)) return false;
    
    const member = org.members.find(m => m._id === memberId);
    return member?.organization_role !== 'chef';
  }
}