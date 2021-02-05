import { PartialPlayer } from "./partialplayer.model";

export class Task {
    target?: PartialPlayer;
    content?: string;
    completed: boolean;
    failed: boolean;
}
