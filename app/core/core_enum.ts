// CoreEnum.ts

enum Direction {
  top,
  down,
  left,
  right
}

enum LogicGate {
  AND,        // Output is true if ALL inputs are true
  OR,         // Output is true if ANY input is true
  NOT,        // Output is the logical negation of the input
  NAND,       // Negation of AND
  NOR,        // Negation of OR
  XOR,        // Exclusive OR: true if inputs are different
  XNOR        // Exclusive NOR: true if inputs are the same
}

enum Logic {
  Implies,            // p → q   : "if p then q"
  ImpliedBy,          // p ← q   : "p is implied by q"
  IfAndOnlyIf,        // p ↔ q   : biconditional
  NotImplies,         // p ↛ q   : only false case of implication
  Converse,           // q → p   : reverse of p → q
  Inverse,            // ¬p → ¬q : negate both parts
  Contrapositive,     // ¬q → ¬p : logically same as p → q
  MaterialNonimplication, // p true, q false case as a distinct relation
  ConverseNonimplication, // q true, p false case as a distinct relation
  NecessaryCondition, // q is necessary for p (p → q)
  SufficientCondition // p is sufficient for q (p → q)
}

enum Step {
  prev,
  next,
  parallel
}

enum AtomId {
  accordion,
  appBar,
  autocomplete,
  avatar,
  badge,
  bottomNavigation,
  breadcrumb,
  button,
  buttonGroup,
  calendar,
  card,
  checkbox,
  chip,
  circularProgress,
  collapse,
  container,
  datePicker,
  dialog,
  divider,
  drawer,
  expansionPanel,
  fab,
  formControl,
  grid,
  iconButton,
  input,
  inputAdornment,
  list,
  listItem,
  listItemText,
  menu,
  menuItem,
  modal,
  paper,
  pagination,
  popover,
  progress,
  radio,
  select,
  slider,
  snackbar,
  stepper,
  switchControl,
  tab,
  table,
  textField,
  toolbar,
  tooltip,
  typography
}

enum State {
  redux,
  context
}

enum Mode {
  dark,
  light
}

export {
  Direction,
  LogicGate,
  Logic,
  Step,
  AtomId,
  State,
  Mode
};

export const CoreEnum = {
  Direction,
  LogicGate,
  Logic,
  Step,
  AtomId,
  State,
  Mode
};