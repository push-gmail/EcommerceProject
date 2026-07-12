import { useOutletContext } from "react-router-dom";
import UserAccountProfileDetails from "./account/UserAccountProfileDetails";

type User = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  walletBalance?: number;
  gender?: string;
  profileImage?: string;
  role?: string;
};

type UserProfileOutletContext = {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loadingUser: boolean;
  refreshUser: () => Promise<void>;
};

export default function UserMyAccount() {
  const { user, setUser, loadingUser } =
    useOutletContext<UserProfileOutletContext>();

  return (
    <UserAccountProfileDetails
      user={user}
      loading={loadingUser}
      onUpdated={(updatedUser) => setUser(updatedUser)}
    />
  );
}