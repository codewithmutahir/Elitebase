type TimesheetsFiltersProps = {
  from: string;
  to: string;
};

export function TimesheetsFilters({ from, to }: TimesheetsFiltersProps) {
  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm"
    >
      <div>
        <label className="mb-1 block text-sm font-semibold" htmlFor="from">
          From
        </label>
        <input
          id="from"
          name="from"
          type="date"
          defaultValue={from}
          required
          className="rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm outline-none ring-[#2563EB] focus:ring-2"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold" htmlFor="to">
          To
        </label>
        <input
          id="to"
          name="to"
          type="date"
          defaultValue={to}
          required
          className="rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm outline-none ring-[#2563EB] focus:ring-2"
        />
      </div>
      <button
        type="submit"
        className="inline-flex h-10 items-center justify-center rounded-lg bg-[#2563EB] px-4 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
      >
        Apply
      </button>
    </form>
  );
}
