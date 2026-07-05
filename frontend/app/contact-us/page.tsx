import Link from "next/link";

export default function ContactUs() {
  return (
    <>
      <div>
        <p>You can participate in our partnership program</p>
        <Link href={"signup/seller"}> seller registration </Link>
        <Link href={"signup/delivery"}> delivery partner registration </Link>
      </div>
    </>
  );
}
