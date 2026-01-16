import { useQuery } from "@tanstack/react-query";
import { getFragmentById } from "@/modules/fragments/action";
import type { IFragment } from "@/modules/fragments/model/fragment";

export const useGetFragment = (fragmentId: string | null) => {
    return useQuery({
        queryKey: ["fragment", fragmentId],
        queryFn: async () => {
            if (!fragmentId) return null;
            const result = await getFragmentById(fragmentId);
            if (result.success && result.fragment) {
                return result.fragment as IFragment;
            }
            return null;
        },
        enabled: !!fragmentId,
        staleTime: 60_000, // Cache for 1 minute
    });
};
