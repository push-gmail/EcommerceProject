import { useEffect, useState } from "react";
import backendApi from "../../../api/backendApi";

type UserData = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  walletBalance?: number;
  gender?: string;
  profileImage?: string;
  role?: string;
};

type Props = {
  user: UserData | null;
  loading?: boolean;
  onUpdated?: (user: UserData) => void;
};

type EditingSection = "personal" | "email" | "phone" | null;

export default function UserAccountProfileDetails({
  user,
  loading = false,
  onUpdated,
}: Props) {
  const [editing, setEditing] = useState<EditingSection>(null);
  const [saving, setSaving] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [emailOtpOpen, setEmailOtpOpen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    email: "",
    phone: "",
  });

  const syncForm = () => {
    const fullName = user?.name || "";
    const [firstName, ...restName] = fullName.split(" ");

    setForm({
      firstName: firstName || "",
      lastName: restName.join(" ") || "",
      gender: user?.gender || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
  };

  useEffect(() => {
    syncForm();
  }, [user]);

  const clearAlerts = () => {
    setError("");
    setMessage("");
  };

  const cancelEdit = () => {
    syncForm();
    setEditing(null);
    clearAlerts();
  };

  const updateProfile = async (payload: Record<string, any>) => {
    try {
      setSaving(true);
      clearAlerts();

      const res = await backendApi.put("/user/update-profile", payload);

      const updatedUser = res.data?.data;

      if (updatedUser) {
        onUpdated?.(updatedUser);
      }

      setMessage(res.data?.message || "Profile updated successfully");
      setEditing(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const savePersonalInfo = () => {
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();

    if (!firstName) {
      setError("First name is required");
      return;
    }

    const name = `${firstName} ${lastName}`.trim();

    updateProfile({
      name,
      gender: form.gender || "",
    });
  };

  const requestEmailOtp = async () => {
    const newEmail = form.email.trim().toLowerCase();

    if (!newEmail) {
      setError("Email address is required");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setError("Enter valid email address");
      return;
    }

    if (newEmail === String(user?.email || "").toLowerCase()) {
      setError("New email is same as current email");
      return;
    }

    try {
      setSendingOtp(true);
      clearAlerts();

      const res = await backendApi.post("/user/request-email-update-otp", {
        email: newEmail,
      });

      setPendingEmail(newEmail);
      setEmailOtp("");
      setEmailOtpOpen(true);
      setMessage(res.data?.message || "OTP sent to your new email");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyEmailOtp = async () => {
    const cleanOtp = emailOtp.trim();

    if (!pendingEmail) {
      setError("Pending email not found");
      return;
    }

    if (!/^[0-9]{6}$/.test(cleanOtp)) {
      setError("Enter valid 6 digit OTP");
      return;
    }

    try {
      setVerifyingOtp(true);
      clearAlerts();

      const res = await backendApi.post("/user/verify-email-update-otp", {
        email: pendingEmail,
        otp: cleanOtp,
      });

      const updatedUser = res.data?.data;

      if (updatedUser) {
        onUpdated?.(updatedUser);
      }

      setMessage(res.data?.message || "Email updated successfully");
      setEmailOtpOpen(false);
      setPendingEmail("");
      setEmailOtp("");
      setEditing(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const closeEmailOtpModal = () => {
    setEmailOtpOpen(false);
    setEmailOtp("");
  };

  const savePhone = () => {
    const phone = form.phone.trim();

    if (!phone) {
      setError("Mobile number is required");
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      setError("Enter valid 10 digit mobile number");
      return;
    }

    updateProfile({ phone });
  };

  if (loading) {
    return (
      <section className="min-h-[760px] bg-white p-8 shadow-sm">
        <div className="h-7 w-56 animate-pulse rounded bg-[#f1f3f6]" />
        <div className="mt-8 grid max-w-[680px] grid-cols-2 gap-3">
          <div className="h-[50px] animate-pulse rounded bg-[#f1f3f6]" />
          <div className="h-[50px] animate-pulse rounded bg-[#f1f3f6]" />
        </div>
        <div className="mt-10 h-[50px] w-[260px] animate-pulse rounded bg-[#f1f3f6]" />
        <div className="mt-10 h-[50px] w-[260px] animate-pulse rounded bg-[#f1f3f6]" />
      </section>
    );
  }

  return (
    <>
      <section className="min-h-[760px] bg-white px-8 py-7 shadow-sm">
        {message && (
          <div className="mb-5 rounded-sm border border-green-200 bg-green-50 px-4 py-3 text-[13px] font-semibold text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-600">
            {error}
          </div>
        )}

        <div className="flex items-center gap-6">
          <h1 className="text-[18px] font-semibold text-[#212121]">
            Personal Information
          </h1>

          {editing === "personal" ? (
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="text-[13px] font-semibold text-[#2874f0]"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditing("personal");
                clearAlerts();
              }}
              className="text-[13px] font-semibold text-[#2874f0]"
            >
              Edit
            </button>
          )}
        </div>

        <div className="mt-7 flex flex-col gap-3 lg:flex-row lg:items-center">
          <input
            readOnly={editing !== "personal"}
            value={form.firstName}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, firstName: event.target.value }))
            }
            placeholder="First Name"
            className={`h-[50px] w-full max-w-[258px] border px-5 text-[14px] outline-none ${
              editing === "personal"
                ? "border-[#2874f0] bg-white text-[#212121]"
                : "border-[#e0e0e0] bg-[#fafafa] text-[#878787]"
            }`}
          />

          <input
            readOnly={editing !== "personal"}
            value={form.lastName}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, lastName: event.target.value }))
            }
            placeholder="Last Name"
            className={`h-[50px] w-full max-w-[258px] border px-5 text-[14px] outline-none ${
              editing === "personal"
                ? "border-[#2874f0] bg-white text-[#212121]"
                : "border-[#e0e0e0] bg-[#fafafa] text-[#878787]"
            }`}
          />

          {editing === "personal" && (
            <button
              type="button"
              onClick={savePersonalInfo}
              disabled={saving}
              className="h-[48px] w-full max-w-[128px] rounded-sm bg-[#2874f0] text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "SAVING..." : "SAVE"}
            </button>
          )}
        </div>

        <div className="mt-7">
          <p className="mb-4 text-[14px] text-[#212121]">Your Gender</p>

          <div className="flex items-center gap-8">
            <GenderRadio
              label="Male"
              value="male"
              checked={form.gender === "male"}
              disabled={editing !== "personal"}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, gender: value }))
              }
            />

            <GenderRadio
              label="Female"
              value="female"
              checked={form.gender === "female"}
              disabled={editing !== "personal"}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, gender: value }))
              }
            />
          </div>

          {editing !== "personal" && (
            <p className="mt-2 text-[12px] text-[#878787]">
              Gender change karne ke liye Personal Information ka Edit click
              karo.
            </p>
          )}
        </div>

        <div className="mt-14">
          <div className="flex items-center gap-7">
            <h2 className="text-[18px] font-semibold text-[#212121]">
              Email Address
            </h2>

            {editing === "email" ? (
              <button
                type="button"
                onClick={cancelEdit}
                disabled={sendingOtp}
                className="text-[13px] font-semibold text-[#2874f0]"
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditing("email");
                  clearAlerts();
                }}
                className="text-[13px] font-semibold text-[#2874f0]"
              >
                Edit
              </button>
            )}
          </div>

          <div className="mt-7 flex flex-col gap-3 lg:flex-row lg:items-center">
            <input
              readOnly={editing !== "email"}
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder="Email Address"
              className={`h-[50px] w-full max-w-[258px] border px-5 text-[14px] outline-none ${
                editing === "email"
                  ? "border-[#2874f0] bg-white text-[#212121]"
                  : "border-[#e0e0e0] bg-[#fafafa] text-[#878787]"
              }`}
            />

            {editing === "email" && (
              <button
                type="button"
                onClick={requestEmailOtp}
                disabled={sendingOtp}
                className="h-[48px] w-full max-w-[128px] rounded-sm bg-[#2874f0] text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sendingOtp ? "SENDING..." : "SAVE"}
              </button>
            )}
          </div>
        </div>

        <div className="mt-14">
          <div className="flex items-center gap-7">
            <h2 className="text-[18px] font-semibold text-[#212121]">
              Mobile Number
            </h2>

            {editing === "phone" ? (
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="text-[13px] font-semibold text-[#2874f0]"
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditing("phone");
                  clearAlerts();
                }}
                className="text-[13px] font-semibold text-[#2874f0]"
              >
                Edit
              </button>
            )}
          </div>

          <div className="mt-7 flex flex-col gap-3 lg:flex-row lg:items-center">
            <input
              readOnly={editing !== "phone"}
              value={form.phone}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  phone: event.target.value.replace(/\D/g, "").slice(0, 10),
                }))
              }
              placeholder="Mobile Number"
              className={`h-[50px] w-full max-w-[258px] border px-5 text-[14px] outline-none ${
                editing === "phone"
                  ? "border-[#2874f0] bg-white text-[#212121]"
                  : "border-[#e0e0e0] bg-[#fafafa] text-[#878787]"
              }`}
            />

            {editing === "phone" && (
              <button
                type="button"
                onClick={savePhone}
                disabled={saving}
                className="h-[48px] w-full max-w-[128px] rounded-sm bg-[#2874f0] text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "SAVING..." : "SAVE"}
              </button>
            )}
          </div>
        </div>

        <div className="mt-14">
          <h2 className="text-[20px] font-semibold text-[#212121]">FAQs</h2>

          <FaqItem
            question="What happens when I update my email address (or mobile number)?"
            answer="Your login email id (or mobile number) changes, likewise. You'll receive all your account related communication on your updated email address (or mobile number)."
          />

          <FaqItem
            question="When will my account be updated with the new email address (or mobile number)?"
            answer="It happens as soon as you confirm the verification code sent to your updated email address or mobile number."
          />

          <FaqItem
            question="What happens to my existing account when I update my email address?"
            answer="Updating your email address only changes your login and communication details. Your orders, wallet, wishlist and account history remain the same."
          />
        </div>
      </section>

      {emailOtpOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-[430px] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
            <div className="border-b border-[#f0f0f0] px-6 py-5">
              <h3 className="text-[20px] font-semibold text-[#212121]">
                Verify Email
              </h3>
              <p className="mt-1 text-[13px] text-[#878787]">
                OTP sent to{" "}
                <span className="font-semibold text-[#212121]">
                  {pendingEmail}
                </span>
              </p>
            </div>

            <div className="px-6 py-6">
              <input
                value={emailOtp}
                onChange={(event) =>
                  setEmailOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="Enter OTP"
                className="h-[50px] w-full border border-[#2874f0] px-4 text-[18px] tracking-[8px] text-[#212121] outline-none"
              />

              <button
                type="button"
                onClick={verifyEmailOtp}
                disabled={verifyingOtp}
                className="mt-5 h-[48px] w-full rounded-sm bg-[#fb641b] text-[14px] font-semibold text-white disabled:opacity-60"
              >
                {verifyingOtp ? "VERIFYING..." : "VERIFY OTP"}
              </button>

              <button
                type="button"
                onClick={requestEmailOtp}
                disabled={sendingOtp || verifyingOtp}
                className="mt-4 w-full text-center text-[13px] font-semibold text-[#2874f0]"
              >
                {sendingOtp ? "Sending OTP..." : "Resend OTP"}
              </button>

              <button
                type="button"
                onClick={closeEmailOtpModal}
                disabled={verifyingOtp}
                className="mt-4 w-full text-center text-[13px] font-semibold text-[#878787]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function GenderRadio({
  label,
  value,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label
      className={`flex items-center gap-3 text-[16px] ${
        disabled
          ? "cursor-not-allowed text-[#878787]"
          : "cursor-pointer text-[#212121]"
      }`}
    >
      <input
        type="radio"
        name="gender"
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        className="hidden"
      />

      <span
        className={`flex h-[16px] w-[16px] items-center justify-center rounded-full border ${
          checked ? "border-[#2874f0]" : "border-[#c2c2c2]"
        }`}
      >
        {checked && (
          <span className="h-[8px] w-[8px] rounded-full bg-[#2874f0]" />
        )}
      </span>

      {label}
    </label>
  );
}

function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <div className="mt-8">
      <h3 className="text-[14px] font-semibold text-[#212121]">{question}</h3>

      <p className="mt-4 max-w-[820px] text-[14px] leading-[22px] text-[#212121]">
        {answer}
      </p>
    </div>
  );
}