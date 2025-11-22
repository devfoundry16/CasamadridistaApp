import { useDispatch, useSelector } from "react-redux";
import { fetchEnvironment } from "@/store/thunks/environmentThunks";
import { AppDispatch, RootState } from "@/store/store";
import { useCallback } from "react";

export const useEnvironment = () => {
  const dispatch = useDispatch<AppDispatch>();
  const environment = useSelector((state: RootState) => state.environment);
  const loadEnvironment = useCallback(() => {
    dispatch(fetchEnvironment());
  }, [dispatch]);
  return {
    auth: environment.auth,
    woocommerce: environment.woocommerce,
    payment: environment.payment,
    isLoading: environment.isLoading,
    error: environment.error,
    loadEnvironment,
  } as const;
};
