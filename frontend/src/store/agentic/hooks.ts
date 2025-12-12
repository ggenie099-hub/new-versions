import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { AgenticDispatch, AgenticRootState } from './store';

export const useAgenticDispatch = () => useDispatch<AgenticDispatch>();
export const useAgenticSelector: TypedUseSelectorHook<AgenticRootState> = useSelector;