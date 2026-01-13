import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    createProject,
    getProjectById,
    getProjects,
} from "@/modules/projects/action";

export function useGetProjects() {
    return useQuery({
        queryKey: ["projects"],
        queryFn: getProjects,
    });
}

export function useGetProjectById(projectId?: string) {
    return useQuery({
        queryKey: ["project", projectId],
        queryFn: () => getProjectById(projectId!),
        enabled: !!projectId,
    });
}

export function useCreateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (value: string) => createProject(value),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["projects"], 
            });
        },
    });
}
