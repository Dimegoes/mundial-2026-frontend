import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PredictionService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // POST /prediction/create-user-group-prediction
  createUserGroupPrediction(userId: number, groupId: number, firstPlaceId: number, secondPlaceId: number): Observable<Record<string, unknown>> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('groupId', groupId.toString())
      .set('first_place_id', firstPlaceId.toString())
      .set('second_place_id', secondPlaceId.toString());

    return this.http.post<Record<string, unknown>>(
      `${this.baseUrl}/prediction/create-user-group-prediction`, null, { params }
    );
  }

  // POST /prediction/create-user-best-thrid (Typo respetado)
  createUserBestThird(userId: number, countryId: number): Observable<Record<string, unknown>> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('countryId', countryId.toString());

    return this.http.post<Record<string, unknown>>(
      `${this.baseUrl}/prediction/create-user-best-thrid`, null, { params }
    );
  }

  // PUT /prediction/update-user-group-prediction
  updateUserGroupPrediction(predictionId: number, firstPlaceId: number, secondPlaceId: number): Observable<Record<string, unknown>> {
    const params = new HttpParams()
      .set('predictionId', predictionId.toString())
      .set('first_place_id', firstPlaceId.toString())
      .set('second_place_id', secondPlaceId.toString());

    return this.http.put<Record<string, unknown>>(
      `${this.baseUrl}/prediction/update-user-group-prediction`, null, { params }
    );
  }

  // PUT /prediction/update-user-best-thrid (Typo respetado)
  updateUserBestThird(userBestThirdId: number, userId: number, countryId: number): Observable<Record<string, unknown>> {
    const params = new HttpParams()
      .set('userBestThirdId', userBestThirdId.toString())
      .set('userId', userId.toString())
      .set('countryId', countryId.toString());

    return this.http.put<Record<string, unknown>>(
      `${this.baseUrl}/prediction/update-user-best-thrid`, null, { params }
    );
  }

  // GET /prediction/get-user-group-prediction
  getUserGroupPrediction(userId: number): Observable<Record<string, unknown>[]> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<Record<string, unknown>[]>(`${this.baseUrl}/prediction/get-user-group-prediction`, { params });
  }

  // GET /prediction/get-user-best-third
  getUserBestThird(userId: number): Observable<Record<string, unknown>[]> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<Record<string, unknown>[]>(`${this.baseUrl}/prediction/get-user-best-third`, { params });
  }

  // DELETE /prediction/delete-user-group-prediction
  deleteUserGroupPrediction(predictionId: number): Observable<Record<string, unknown>> {
    const params = new HttpParams().set('predictionId', predictionId.toString());
    return this.http.delete<Record<string, unknown>>(`${this.baseUrl}/prediction/delete-user-group-prediction`, { params });
  }
}
