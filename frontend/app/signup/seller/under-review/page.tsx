import Link from "next/link";

export default function UnderReviewPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-white shadow-lg rounded-2xl p-8 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center">
            <span className="text-4xl">⏳</span>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Account Under Review
        </h1>

        {/* Description */}
        <p className="text-gray-600 leading-relaxed mb-6">
          Thank you for registering as a seller. Your application has been
          submitted successfully and is currently being reviewed by our team.
        </p>

        <p className="text-gray-600 leading-relaxed mb-8">
          you can check yuor status by login to your account
        </p>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 text-yellow-800 font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
          Status: Pending Approval
        </div>

        <Link
          href="/"
          className="block text-2xl text-black bg-blue-200 rounded-2xl *:border-black border-2 m-1 hover:bg-blue-500"
        >
          {" "}
          Go Back Home{" "}
        </Link>

        {/* Info Box */}
        <div className="bg-gray-50 border rounded-xl p-4 text-left">
          <h2 className="font-semibold text-gray-800 mb-2">
            What happens next?
          </h2>

          <ul className="space-y-2 text-gray-600 text-sm">
            <li>✓ Our team will verify your details.</li>
            <li>✓ Your shop information will be reviewed.</li>
            <li>✓ You'll gain access after approval.</li>
            <li>✓ You can log in again later to check your status.</li>
          </ul>
        </div>

        {/* Footer */}
        <p className="mt-6 text-sm text-gray-500">
          Need help? Contact support if you have any questions regarding your
          application.
        </p>
      </div>
    </div>
  );
}
