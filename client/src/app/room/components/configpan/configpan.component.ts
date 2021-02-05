import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-configpan',
    templateUrl: './configpan.component.html',
    styleUrls: ['./configpan.component.scss']
})
export class ConfigpanComponent implements OnInit {

    toggled: boolean = false;

    sampleTasksTypes : string[] = ["default", "test", "you sure ?"];

    constructor() { }

    ngOnInit(): void {
    }

}
