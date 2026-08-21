// app/signup/delivery/verify-otp/page.tsx
import { Suspense } from "react";
import VerifyOtpContent from "./VerifyOtpContent";

export default function DeliveryVerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <VerifyOtpContent />
    </Suspense>
  );
}
