import DottedBackground from "@/components/DottedBackground";
import { onBoardUser } from "@/modules/auth/actions";

export default async function AppLayout({children,}: {children: React.ReactNode;}) {
    await onBoardUser();
    return (
        <main className="relative flex flex-col min-h-screen overflow-x-hidden">
            <DottedBackground />
            <div className="relative z-10 flex-1 w-full mt-20">
                {children}
            </div>
        </main>
    );
}
