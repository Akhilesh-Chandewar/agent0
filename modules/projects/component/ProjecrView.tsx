"use client";

import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import ProjectHeader from "./ProjectHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, EyeIcon } from "lucide-react";
import FragmentWeb from "./FragmentWeb";

function ProjecrView({ projectId }: { projectId: string }) {
    return (
        <div className="h-screen">
            <ResizablePanelGroup direction="horizontal" className="h-full">
                <ResizablePanel
                    defaultSize={35}
                    minSize={20}
                    className="flex flex-col min-h-0"
                >
                    <ProjectHeader projectId={projectId} />
                </ResizablePanel>
                <ResizablePanel defaultSize={65} minSize={50}>
                    <Tabs
                        className="h-full flex flex-col"
                        defaultValue="preview"
                        // value={tabState}
                        // onValueChange={(value) => setTabState(value)}
                    >
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

                        <TabsContent
                            value="preview"
                            className="flex-1 h-[calc(100%-4rem)] overflow-hidden"
                        >
                            {/* {activeFragment ? (
                                <FragmentWeb data={activeFragment} />
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    Select a fragment to preview
                                </div>
                            )} */}
                            <FragmentWeb />
                        </TabsContent>
                        <TabsContent
                            value="code"
                            className="flex-1 h-[calc(100%-4rem)] overflow-hidden"
                        >
                            {/* {activeFragment?.files ? (
                                <FileExplorer files={activeFragment.files} />
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    Select a fragment to view code
                                </div>
                            )} */}
                        </TabsContent>
                    </Tabs>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    )
}

export default ProjecrView