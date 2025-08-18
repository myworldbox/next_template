import { CoreEnum } from "./core_enum";

const CoreConst = {

  config: {
    state: CoreEnum.State.context,
    mode: CoreEnum.Mode.dark
  },

  util: {
    http: {
      header: {
        Accept: "application/json",
        "Content-Type": "application/json",
      }
    }
  },

  url: {
    myworldbox: "https://myworldbox.github.io",
    myapibox: "https://myapibox.vercel.app",
  },

  company: {
    copyright: "Copyright© 2020. VL Blockchain."
  },

  solgan: {

  },

  color: {
    button: {
      confirm: "",
      cancel: ""
    },
    border: {
      confirm: "",
      cancel: ""
    }
  }
}

export default CoreConst;