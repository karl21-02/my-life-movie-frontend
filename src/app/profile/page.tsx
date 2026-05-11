import { ProfileSummary } from "@/features/profile/components/ProfileSummary";

export const metadata = {
  title: "프로필 | My Life Movie",
};

export default function ProfilePage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-zinc-50">프로필</h1>
        <p className="mt-0.5 text-sm text-zinc-400">
          계정 정보와 인증 상태를 확인합니다.
        </p>
      </div>

      <ProfileSummary />
    </div>
  );
}
