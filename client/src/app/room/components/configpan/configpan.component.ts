import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Config } from 'src/app/class/game/config.model';

@Component({
    selector: 'app-configpan',
    templateUrl: './configpan.component.html',
    styleUrls: ['./configpan.component.scss']
})
export class ConfigpanComponent implements OnInit {

    toggled: boolean = false;

    sampleTasksTypes : string[] = ["default", "test", "you sure ?"];

    @Input() admin: boolean = false;
    @Input() config: Config;
    @Output() onUpdateConfig: EventEmitter<any> = new EventEmitter();

    constructor() { }

    ngOnInit(): void { }

    configChanged() : void {
        console.log("elo");
        this.onUpdateConfig.emit();
    }
}
