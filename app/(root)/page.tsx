import { UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="flex items-center justify-center h-screen">
      <UserButton />
    </div>
  );
}
