import ProtectedRoute from "@/components/auth/ProtectedRoute";
import UserProfile from "@/components/dashboard/UserProfile";

export default function ProfilePage() {
  return (
    <ProtectedRoute requireAuth={true}>
      <UserProfile />
    </ProtectedRoute>
  );
}
