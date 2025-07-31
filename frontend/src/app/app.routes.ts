import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AccueilComponent } from './pages/acceuil/accueil.component';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
import { CreateQuizComponent } from './pages/quiz/create-quiz/create-quiz.component';
import { QuizListComponent } from './pages/quiz/quiz-list/quiz-list.component';
import { PlayQuizComponent } from './pages/quiz/play-quiz/play-quiz.component';
import { EditQuizComponent } from './pages/quiz/edit-quiz/edit-quiz.component';
import { CreateOrganizationComponent } from './pages/organization/create-organization/create-organization.component';
import { OrganizationComponent } from './pages/organization/organization/organization.component';
import { DonationComponent } from './components/donation/donation.component';
import { DonationSuccessComponent } from './pages/donation-page/donation-success.component';
import { DonationCancelComponent } from './pages/donation-page/donation-cancel.component';



export const routes: Routes = [
  { path: "login", component: LoginComponent, canActivate: [guestGuard] },
  { path: "register", component: RegisterComponent, canActivate: [guestGuard] },

  { path: "accueil", component: AccueilComponent, canActivate: [authGuard] },
  { path: 'create-quiz', component: CreateQuizComponent, canActivate: [authGuard] },
  { path: 'quiz-list', component: QuizListComponent, canActivate: [authGuard] },
  { path: 'play-quiz/:id', component: PlayQuizComponent, canActivate: [authGuard] },
  { path: 'edit-quiz/:id', component: EditQuizComponent, canActivate: [authGuard] },
  { path: 'create-organization', component: CreateOrganizationComponent, canActivate: [authGuard] },
  { path: 'organization/:id', component: OrganizationComponent, canActivate: [authGuard] },
  { path: 'donation', component: DonationComponent, canActivate: [authGuard] },
  { path: 'donation/success', component: DonationSuccessComponent, canActivate: [authGuard] },
  { path: 'donation/cancel', component: DonationCancelComponent, canActivate: [authGuard] },
  
  { path: '', redirectTo: '/accueil', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
