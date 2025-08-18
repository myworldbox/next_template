import { NextRouter } from "next/router";
import { CoreType } from "./core_type";

export namespace CoreInterface {
    export interface Request {
        service: any;
        data: any;
        key: any;
        crypto: any;
    }

    export interface Init {
        middleware: () => any;
        route: () => any;
    }

    export interface Stateful {
        state: Partial<CoreType.app_type>;
        dispatch: any;
    }

    export interface Service {
        auth: {};
        crypto: {};
        database: {};
        payment: {};
        storage: {};
    }

    export interface Activity {
        init: (x: any) => any;
        dispose?: (x: any) => any;
    }

    export interface Auth {
        login: (x: any) => any;
        logout: (x: any) => any;
    }

    export interface Crypto {
        Encrypt: (x: any) => any;
        Decrypt: (x: any) => any;
    }

    export interface Crud {
        create: (x: any) => any;
        read: (x: any) => any;
        update: (x: any) => any;
        delete: (x: any) => any;
    }

    export interface Transaction {
        pay: (x: any) => any;
        refund: (x: any) => any;
    }

    export interface Pattern {
        ref: (x: any) => any;
    }

    export interface State {
        init: () => any;
        use: () => any;
    }

    export interface Page {
        Fixed?: () => { route: NextRouter; stateful: CoreInterface.Stateful };
        Selector?: (x: any) => any;
        Val?: any;
        Func?: any;
    }

    export interface File {
        json: any;
        svg: any;
        css: any;
        txt: any;
    }

    // Note: Kit is generic, so it needs to stay generic
    export interface Kit<T, U> {
        volatile: T;
        unchange: U;
        create: Function;
        render: Function;
    }
}