import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AccueilComponent } from './pages/acceuil/accueil.component';
import { authGuard } from './guards/auth.guard';
import { CreateQuizComponent } from './pages/quiz/create-quiz/create-quiz.component';
import { QuizListComponent } from './pages/quiz/quiz-list/quiz-list.component';
import { PlayQuizComponent } from './pages/quiz/play-quiz/play-quiz.component';
import { EditQuizComponent } from './pages/quiz/edit-quiz/edit-quiz.component';


export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: "login", component: LoginComponent },
  { path: "register", component: RegisterComponent },
  { path: "accueil", component: AccueilComponent, canActivate: [authGuard] },
  { path: 'create-quiz', component: CreateQuizComponent, canActivate: [authGuard] },
  { path: 'quiz-list', component: QuizListComponent, canActivate: [authGuard] },
  { path: 'play-quiz/:id', component: PlayQuizComponent, canActivate: [authGuard] },
  { path: 'edit-quiz/:id', component: EditQuizComponent, canActivate: [authGuard] },
  { path: '**',redirectTo: '' }
];
