import connectToDatabase from "@/lib/databaseConnection";

export default async function Home() {
  await connectToDatabase();
  return (
    <>
    </>
  );
}
