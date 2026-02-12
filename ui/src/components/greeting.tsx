export function Greeting() {
  return (
    <div className="mx-auto mt-6 flex w-full max-w-3xl flex-col gap-2 px-4 md:mt-12 md:px-8">
      <div className="text-xl font-semibold md:text-2xl">Hello there!</div>
      <div className="text-lg text-muted-foreground md:text-xl">
        How can I help you today?
      </div>
    </div>
  );
}
