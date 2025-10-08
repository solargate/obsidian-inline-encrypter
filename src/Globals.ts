export type GlobalState = { passwordGlobal: string, passwordRemember: boolean };

export const State: GlobalState = { passwordGlobal: '', passwordRemember: false };

export function saveStatePasswordGlobal(value: string) {
    State.passwordGlobal = value;
}

export function saveStatePasswordRemember(value: boolean) {
    State.passwordRemember = value;
}
