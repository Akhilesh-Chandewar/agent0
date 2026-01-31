import React from "react";
import CodeWindow from "@/modules/fragments/component/FileViewer";
import DemoWindow from "@/components/DemoWindow";

export const dynamic = "force-dynamic";

export default function DemoPage() {
    return (
        <div className="h-screen grid grid-cols-2 gap-2 p-4">
            <div className="border rounded-md overflow-auto">
                <h3 className="p-2 font-semibold">Code</h3>
                <div className="p-2">
                    <CodeWindow
                        fileName="Example.tsx"
                        content={
                            `import React from \"react\";\n\nexport default function Example() {\n  return <div>Hello from example file</div>;\n}`
                        }
                    />
                </div>
            </div>
            <div className="border rounded-md overflow-auto flex flex-col">
                <h3 className="p-2 font-semibold">Agent Flow</h3>
                <div className="p-2 flex-1">
                    <DemoWindow />
                </div>
            </div>
        </div>
    );
}
