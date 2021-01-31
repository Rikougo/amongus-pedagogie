import { stringify } from '@angular/compiler/src/util';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiTalkerService } from '../api-talker.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

    pannel = this.formBuilder.group({
        name: new FormControl('', [
            Validators.required,
            Validators.minLength(4)
        ]),
        roomId: new FormControl('', [
            Validators.required,
            Validators.pattern(/([A-Z]|[0-9]){5}/g)
        ])
    });

    createRoomError: boolean = false;

    creationAttempt: boolean = false;
    joinAttempt: boolean = false;

    constructor(
        private router: Router,
        private apiTalker: ApiTalkerService, 
        private formBuilder: FormBuilder) { }

    ngOnInit(): void { }

    get isNameValid() : boolean { 
        let field = this.pannel.get("name");
        return !(field?.valid!) && (this.creationAttempt || this.joinAttempt); 
    }

    get isCodeValid() : boolean {
        let field = this.pannel.get("roomId");
        return (!field?.valid!) && this.joinAttempt;
    }

    createRoom(): void {
        this.apiTalker.getNewRoom().subscribe((data: any) => { 
            const code = data.roomId;

            if (!code) {
                this.createRoomError = true;

                return;
            }

            this.createRoomError = false;

            let name = this.pannel.get('name');
            this.creationAttempt = true;
    
            if (name && name.valid) {
                this.creationAttempt = false;
                this.router.navigate(["room", {roomId: code, name: name.value}]);
            }
        }, (_) => {
            this.createRoomError = true;
        });
        
    }

    joinRoom(): void {
        let name = this.pannel.get('name')!;
        let code = this.pannel.get('roomId')!;
        this.joinAttempt = true;

        if (name.valid && code.valid) {
            this.joinAttempt = false;
            this.router.navigate(["room", {roomId: code.value, name: name.value}]);
        }
    }
}
