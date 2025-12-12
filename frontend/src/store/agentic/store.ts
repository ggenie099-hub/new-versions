import { configureStore } from '@reduxjs/toolkit';
import workflowsReducer from './workflowsSlice';

export const agenticStore = configureStore({
  reducer: {
    workflows: workflowsReducer,
  },
});

export type AgenticRootState = ReturnType<typeof agenticStore.getState>;
export type AgenticDispatch = typeof agenticStore.dispatch;