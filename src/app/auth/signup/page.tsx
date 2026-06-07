import { AuthForm } from "@/features/auth/components/AuthForm";
import { normalizeNextPath } from "@/features/auth/routes";

type AuthPageProps = {
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

export default async function SignupPage({ searchParams }: AuthPageProps) {
  const nextPath = normalizeNextPath((await searchParams).next);

  return <AuthForm mode="signup" nextPath={nextPath} />;
}
