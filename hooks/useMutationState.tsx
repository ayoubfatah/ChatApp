import { useMutation } from "convex/react";
import { useState } from "react";

export default function useMutationState(mutationToRun: any) {
  const [isPending, setIsPending] = useState(false);

  const mutationFn = useMutation(mutationToRun);
  const mutate = (payload: any) => {
    setIsPending(true);
    return mutationFn(payload)
      .then((res) => {
        return res;
      })
      .catch((error) => {
        throw error;
      })
      .finally(() => {
        setIsPending(false);
      });
  };
  return { mutate, isPending };
}
