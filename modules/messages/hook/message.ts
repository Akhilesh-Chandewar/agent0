import {
    useQuery,
    useMutation,
    useQueryClient,
    QueryClient
} from "@tanstack/react-query";

import { createMessage, getMessages } from "@/modules/messages/action";
import type { IMessage } from "@/modules/messages/model/messages";


export const prefetchMessages = async (
    queryClient: QueryClient,
    projectId: string
) => {
    await queryClient.prefetchQuery<IMessage[]>({
        queryKey: ["messages", projectId],
        queryFn: () => getMessages(projectId),
        staleTime: 10_000,
    });
};

export const useGetMessages = (projectId: string) => {
    return useQuery<IMessage[]>({
        queryKey: ["messages", projectId],
        queryFn: () => getMessages(projectId),
        staleTime: 10_000,
        refetchInterval: (query) => {
            const data = query.state.data;
            return data && data.length > 0 ? 5000 : false;
        },
    });
};

export const useCreateMessages = (projectId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (value: string) =>
            createMessage(value, projectId),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["messages", projectId],
            });

            queryClient.invalidateQueries({
                queryKey: ["status"],
            });
        },
    });
};
