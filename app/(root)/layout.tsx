import DottedBackground from "@/components/DottedBackground";
import { onBoardUser } from "@/modules/auth/actions";
import { Navbar } from "@/modules/home/components/Navbar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children, }: { children: React.ReactNode; }) {
    await onBoardUser();
    return (
        <main className="relative flex flex-col min-h-screen overflow-x-hidden">
            <DottedBackground />
            <Navbar />
            <div className="relative z-10 flex-1 w-full mt-20">
                {children}
            </div>
        </main>
    );
}
