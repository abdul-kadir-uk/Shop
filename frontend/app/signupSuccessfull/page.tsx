import Link from "next/link";

const SignupSuccessfull = () => {
  return (
    <div className="flex justify-center items-center min-h-screen p-3">
      <div>
        <h1 className="text-green-600 text-2xl">
          {" "}
          You Have Successfully Signed up{" "}
        </h1>
        <p>please login to continue </p>
        <Link className="text-blue-600" href={"/login"}>
          {" "}
          Login{" "}
        </Link>
      </div>
    </div>
  );
};

export default SignupSuccessfull;
