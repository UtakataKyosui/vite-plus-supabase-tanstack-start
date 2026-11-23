import { Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "../hooks/useMutation";
import { loginFn } from "../routes/_authed";
import { signupFn } from "../routes/signup";
import { Auth } from "./auth/auth-card";

export function Login() {
  const router = useRouter();

  const loginMutation = useMutation({
    fn: loginFn,
    onSuccess: async (ctx) => {
      if (!ctx.data?.error) {
        await router.invalidate();
        router.navigate({ to: "/dashboard" });
        return;
      }
    },
  });

  const signupMutation = useMutation({
    fn: useServerFn(signupFn),
  });

  return (
    <Auth
      actionText="Sign in"
      description="Sign in to manage your inventory."
      footer={
        <>
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign up
          </Link>
        </>
      }
      status={loginMutation.status}
      onSubmit={(e) => {
        const formData = new FormData(e.target as HTMLFormElement);

        loginMutation.mutate({
          data: {
            email: formData.get("email") as string,
            password: formData.get("password") as string,
          },
        });
      }}
      afterSubmit={
        loginMutation.data ? (
          <>
            <div role="alert" className="text-sm text-destructive">
              {loginMutation.data.message}
            </div>
            {loginMutation.data.error &&
            loginMutation.data.message === "Invalid login credentials" ? (
              <div>
                <button
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  onClick={(e) => {
                    const formData = new FormData((e.target as HTMLButtonElement).form!);

                    signupMutation.mutate({
                      data: {
                        email: formData.get("email") as string,
                        password: formData.get("password") as string,
                      },
                    });
                  }}
                  type="button"
                >
                  Sign up instead?
                </button>
              </div>
            ) : null}
          </>
        ) : null
      }
    />
  );
}
