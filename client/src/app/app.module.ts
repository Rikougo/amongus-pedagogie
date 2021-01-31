import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientJsonpModule, HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RoomComponent } from './room/room.component';

@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        RoomComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        HttpClientJsonpModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
