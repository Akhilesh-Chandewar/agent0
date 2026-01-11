export default function DottedBackground() {
  return (
    <div
      aria-hidden
      className="
        fixed inset-0
        z-0
        pointer-events-none
        bg-[radial-gradient(circle,#dadde2_1px,transparent_1px)]
        dark:bg-[radial-gradient(circle,#393e4a_1px,transparent_1px)]
        [background-size:16px_16px]
      "
    />
  );
}
