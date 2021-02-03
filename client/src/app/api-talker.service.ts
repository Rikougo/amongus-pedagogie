import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ApiTalkerService {

    newRoomUrl = `${environment.API_ENDPOINT}/api/createRoom`;

    constructor(private http: HttpClient) { }

    getNewRoom() {
        console.log(`Calling ${this.newRoomUrl}`);
        return this.http.get(this.newRoomUrl).pipe(catchError(this.handleError));
    }

    private handleError(error: HttpErrorResponse) {
        if (error.error instanceof  ErrorEvent){
            console.error('An error occurred:', error.error.message);
        } else {
            // The backend returned an unsuccessful response code.
            // The response body may contain clues as to what went wrong.
            console.error(
              `Backend returned code ${error.status}, ` +
              `body was: ${error.error}`);
          }
          // Return an observable with a user-facing error message.
          return throwError('Something bad happened; please try again later.');
    }
}
