import { getProjectById } from "@/modules/projects/action";
import ProjecrView from "@/modules/projects/component/ProjectView";

interface Props {
    params: Promise<{ projectid: string }>
}

async function Project({ params }: Props) {
    const { projectid } = await params;

    return (
        <ProjecrView projectId={projectid} />
    )
}

export default Project;