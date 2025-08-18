export namespace CoreType {
  export type app_type = {
    cache: cache_type;
    file: File;
    json: json_type;
    svg: svg_type;
    account: account_type;
    system: system_type;
    ui: ui_type;
    page: page_type;
  };

  export type action = { type: any; payload: any };

  type page_data_type = {
    form: form_data_type;
  };

  type form_data_type = {
    first_name?: string;
    last_name?: string;
    alias?: string;
    school_email?: string;
    personal_email?: string;
    country_code?: number;
    phone_number?: number;
    instagram_id?: string;
    telegram_id?: string;
    subscription?: boolean;
    role: string;
  };

  type page_type = {
    /** public */
    introduction: page_data_type;
    login: page_data_type;
    register: page_data_type;
    forget_password: page_data_type;
    reset_password: page_data_type;
    error: page_data_type;
    contact: page_data_type;
    help: page_data_type;
    policy: page_data_type;

    /** private */
    console: page_data_type;
    activity: page_data_type;
    past_paper: page_data_type;
    setting: page_data_type;
    profile: page_data_type;
  };

  type cache_type = {
    param: Object;
    callback: Object;
    element: Object;
  };

  type json_type = {
    app: {
      hkust_path_advisor: any;
      myworldbox: any;
      vlblockchain: any;
    };
    locale: {
      en_us: any;
      zh_hk: any;
    };
    global: {
      const: any;
      config: any;
    };
    domain: {
      email: [];
    };
    motto: [];
    page: {
      root: {
        name: string;
        overview: string;
        company: string;
        slang: string;
        featured: {
          client: [];
        };
      };
    };
  };

  type svg_type = {
    company: {};
    organization: {};
    self_funded_institution: {};
    university_extension_arm: {};
    university: {
      buhk: SVGElement;
      cityu: SVGElement;
      cuhk: SVGElement;
      eduhk: SVGElement;
      hkmu: SVGElement;
      hksyu: SVGElement;
      hkust: SVGElement;
      hsuhk: SVGElement;
      lu: SVGElement;
      polyu: SVGElement;
    };
  };

  type account_type = {
    info: {
      name: {
        first: string;
        last: string;
        alias: string;
      };
      id: {
        number: number;
        time: {
          renew: number;
          expiry: number;
        };
      };
      passport: {
        number: number;
      };
      nationity: string;
      gender: string;
      birthday: number;
      email: {
        university: {
          name: string;
          email: string;
        };
        post_secondary: {
          name: string;
          email: string;
        };
        primary: {
          name: string;
          email: string;
        };
      };
      phone: {
        country_code: number;
        number: number;
      };
      telegrame: {
        id: string;
      };
      instagram: {
        id: string;
      };
    };
    status: {
      membership: string;
      time: {
        creation: number;
        update: number;
      };
      verification: {
        phone_number: boolean;
        email: {
          university: boolean;
          post_secondary: boolean;
          primary: boolean;
        };
      };
    };
    setting: {
      lang: string;
      theme: string;
      subscription: {
        activity: boolean;
        promotion: boolean;
      };
    };
    payment: {
      card: {
        credit: {
          name: {
            first: string;
            last: string;
          };
          number: {
            account: number;
            security: number;
          };
          expiry: number;
          type: string;
        };
        debit: {
          name: {
            first: string;
            last: string;
          };
          number: {
            account: number;
            security: number;
          };
          expiry: number;
          type: string;
        };
      };
      digital: {
        alipay: {
          id: string;
        };
        wechat_pay: {
          id: string;
        };
        payme: {
          phone_number: number;
        };
        fps: {
          account_number: number;
        };
      };
      crypto: {
        name: {
          first: string;
          last: string;
        };
        number: {
          account: number;
          security: number;
        };
        expiry: number;
        type: string;
      };
    };
    history: {
      transaction: [];
    };
  };

  type system_type = {
    message: string;
    ok: boolean;
    path: string;
  };

  type ui_type = {
    [x: string]: any;
    width: number;
    height: number;
    layout: JSX.Element[];
  };
}