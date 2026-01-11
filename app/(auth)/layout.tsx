import DottedBackground from "@/components/DottedBackground";

export default function AuthLayout({children,}: {children: React.ReactNode;}) {
    return (
        <div className="relative flex min-h-screen items-center justify-center">
            <DottedBackground />
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
