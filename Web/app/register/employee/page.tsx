import Link from "next/link";

export default function EmployeeRegisterInfoPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] px-6 py-16 text-[#0F172A]">
      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">Employee Registration</h1>
        <p className="mt-6 text-lg text-[#334155]">
          Your employer manages your account. Your manager will add you and give
          you a PIN. You&apos;ll use that PIN on your workplace tablet to clock in.
        </p>
        <p className="mt-6 text-[#64748B]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#2563EB]">
            Sign In
          </Link>
        </p>
      </section>
    </main>
  );
}
