type ComingSoonProps = {
  title: string;
  step: string;
};

export function ComingSoon({ title, step }: ComingSoonProps) {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-3 text-[#64748B]">
        This section is coming in {step} of the build plan. Use the dashboard for
        now.
      </p>
    </div>
  );
}
