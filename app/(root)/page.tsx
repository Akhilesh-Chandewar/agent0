import ProjectForm from "@/modules/home/components/ProjectForm";
import ProjectList from "@/modules/home/components/ProjectList";

export default function Page() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl">
        <section className="flex flex-col items-center space-y-10">
          <div className="flex flex-col items-center">
            Agent0
          </div>
          <div className="space-y-3 text-center">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              From idea to <span className="text-primary">AI agent</span>
            </h1>
            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Describe what you want? Agent0 builds and runs intelligent agents for you.
            </p>

          </div>

          <div className="w-full max-w-3xl">
            <ProjectForm />
          </div>
          <div className="w-full max-w-3xl border-t border-muted/40" />
          <div className="w-full">
            <ProjectList />
          </div>
        </section>
      </div>
    </div>
  );
}
