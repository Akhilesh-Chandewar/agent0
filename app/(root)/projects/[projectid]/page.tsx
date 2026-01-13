import { getProjectById } from "@/modules/projects/action";

interface Props {
    params: Promise<{ projectid: string }>
}

async function Project({ params }: Props) {
    const { projectid } = await params;

    const result = await getProjectById(projectid);

    if (!result.success || !result.project) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
                    <p className="text-gray-600">{result.message || "Project not found"}</p>
                </div>
            </div>
        );
    }

    const { project } = result;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        {project.name}
                    </h1>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-600">Project ID</label>
                            <p className="text-gray-800">{project._id?.toString()}</p>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-600">User ID</label>
                            <p className="text-gray-800">{project.userId?.toString()}</p>
                        </div>

                        {project.createdAt && (
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Created At</label>
                                <p className="text-gray-800">
                                    {new Date(project.createdAt).toLocaleString()}
                                </p>
                            </div>
                        )}

                        {project.messages && project.messages.length > 0 && (
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Messages</label>
                                <p className="text-gray-800">{project.messages.length} message(s)</p>
                            </div>
                        )}

                        {/* {project.description && (
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Description</label>
                                <p className="text-gray-800">{project.description}</p>
                            </div>
                        )} */}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Project;