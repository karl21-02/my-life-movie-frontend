import { AuthForm } from "@/features/auth/components/AuthForm";
import { normalizeNextPath } from "@/features/auth/routes";

type AuthPageProps = {
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: AuthPageProps) {
  const nextPath = normalizeNextPath((await searchParams).next);

  return <AuthForm mode="login" nextPath={nextPath} />;
}
