import {
  COPY_SLOT_DAY,
  COPY_SLOT_WEEK,
  DELETE_SLOT_FROM_CLIPBOARD,
  ADD_SLOT_TO_CLIPBOARD,
} from "../actions/action-types";

const defaultState = {
  day: null,
  week: null,
};

export const copyPasteReducer = (state = defaultState, action) => {
  switch (action.type) {
    case COPY_SLOT_DAY:
      return { ...state, day: { ...action.payload } };
    case COPY_SLOT_WEEK:
      return { ...state, week: { ...action.payload } };
    case DELETE_SLOT_FROM_CLIPBOARD:
      return {
        ...state,
        week: {
          ...state.week,
          slots: state.week.slots.filter((slot) => slot.id !== action.payload),
        },
      };
    case ADD_SLOT_TO_CLIPBOARD:
      return {
        ...state,
        week: { ...state.week, slots: state.week.slots.concat(action.payload) },
      };
    default:
      return state;
  }
};

export default copyPasteReducer;
