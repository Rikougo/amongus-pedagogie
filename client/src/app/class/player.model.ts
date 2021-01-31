export class Player {
    id: string;
    name: string;
    admin: boolean;
    alive: boolean | undefined;

    constructor(options: any = undefined) {
        this.id = options?.id;
        this.name = options?.name;
        this.admin = options?.admin;
        this.alive = options?.alive;
    }
}
