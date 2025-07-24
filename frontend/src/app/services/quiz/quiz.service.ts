import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Quiz {
  _id?: string;
  title: string;
  description?: string;
  creator_id: string;
  organization_id?: string;
  visibility: 'public' | 'private' | 'organization';
  allowed_emails: string[];
  questions: Question[];
  has_timer?: boolean;
  total_time?: number;
  created_at?: Date;
}

export interface Question {
  _id?: string;
  content: string;
  type: 'QCM' | 'ordre' | 'intrus' | 'association' | 'blind_test';
  quiz_id?: string;
  answers: Answer[];
  time_limit?: number;
  audio_file_name?: string;
  audio_url?: string;
}

export interface Answer {
  _id?: string;
  content: string;
  is_correct: boolean;
  question_id?: string;
  correct_order?: number;
  association_target?: string;
}

@Injectable({ providedIn: 'root' })
export class QuizService {
  private http = inject(HttpClient);
  private API_URL = `${environment.apiUrl}/quiz`;


  createQuiz(quiz: Partial<Quiz>): Observable<{ message: string; quizId: string }> {
    return this.http.post<{ message: string; quizId: string }>(`${this.API_URL}/create`, quiz);
  }

  createQuizWithAudio(formData: FormData): Observable<{ message: string; quizId: string }> {
    return this.http.post<{ message: string; quizId: string }>(`${this.API_URL}/create-with-audio`, formData);
  }


  getAllQuizzes(): Observable<Quiz[]> {
    return this.http.get<Quiz[]>(`${this.API_URL}/all`);
  }


  getQuizById(id: string): Observable<Quiz> {
    return this.http.get<Quiz>(`${this.API_URL}/${id}`);
  }


  updateQuiz(id: string, quiz: Partial<Quiz>): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.API_URL}/${id}`, quiz);
  }


  deleteQuiz(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/${id}`);
  }


  inviteUserToQuiz(quizId: string, email: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.API_URL}/${quizId}/invite`, { email });
  }


  submitQuizAnswers(quizId: string, answers: Record<string, string>): Observable<{ score: number }> {
    return this.http.post<{ score: number }>(`${this.API_URL}/${quizId}/submit`, answers);
  }
}