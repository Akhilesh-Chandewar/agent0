"use client";

import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import ProjectHeader from "./ProjectHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, EyeIcon } from "lucide-react";
import FragmentWeb from "./FragmentWeb";
import { useState } from "react";
import MessageContainer from "./MessageContainer";

function ProjectView({ projectId }: { projectId: string }) {
    const [activeFragment, setActiveFragment] = useState<string | null>(null);

    return (
        <div className="h-screen">
            <ResizablePanelGroup direction="horizontal" className="h-full">
                <ResizablePanel
                    defaultSize={35}
                    minSize={20}
                    className="flex flex-col min-h-0"
                >
                    <ProjectHeader projectId={projectId} />

                    <MessageContainer
                        projectId={projectId}
                        activeFragment={activeFragment}
                        setActiveFragment={setActiveFragment}
                    />
                </ResizablePanel>

                <ResizablePanel defaultSize={65} minSize={50}>
                    <Tabs className="h-full flex flex-col" defaultValue="preview">
                        <div className="w-full flex items-center p-2 border-b gap-x-2">
                            <TabsList className="h-8 p-0 border rounded-md">
                                <TabsTrigger
                                    value="preview"
                                    className="rounded-md px-3 flex items-center gap-x-2"
                                >
                                    <EyeIcon className="h-4 w-4" />
                                    <span>Demo</span>
                                </TabsTrigger>

                                <TabsTrigger
                                    value="code"
                                    className="rounded-md px-3 flex items-center gap-x-2"
                                >
                                    <Code className="h-4 w-4" />
                                    <span>Code</span>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Preview tab */}
                        <TabsContent
                            value="preview"
                            className="flex-1 h-[calc(100%-4rem)] overflow-hidden"
                        >
                            {activeFragment ? (
                                // TODO: fetch fragment by ID here
                                // <FragmentWeb fragmentId={activeFragment} />
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    Preview fragment: {activeFragment}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    Select a fragment to preview
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent
                            value="code"
                            className="flex-1 h-[calc(100%-4rem)] overflow-hidden"
                        >
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                Select a fragment to view code
                            </div>
                        </TabsContent>
                    </Tabs>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}

export default ProjectView;
