"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { TextInput } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const { login, currentUser, isReady } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isReady && currentUser) router.replace("/dashboard");
  }, [currentUser, isReady, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (await login(email, password)) {
      router.replace("/dashboard");
      return;
    }

    setError("Email or password did not match.");
    setIsSubmitting(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-8">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <Image
          src="/team-syndicate-logo.jpg"
          alt="Team Syndicate"
          width={280}
          height={280}
          priority
          className="h-auto w-56 object-contain sm:w-72"
        />

        <section className="w-full rounded-lg border border-slate-200 bg-white p-5 text-slate-950 shadow-lg">
          <form className="space-y-4" onSubmit={submit}>
            <TextInput
              label="Email"
              type="email"
              required
              value={email}
              onChange={setEmail}
            />
            <TextInput
              label="Password"
              type="password"
              required
              value={password}
              onChange={setPassword}
            />
            {error ? (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-950 bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              {isSubmitting ? "Logging in" : "Login"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
